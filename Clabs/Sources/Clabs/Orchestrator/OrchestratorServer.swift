import Foundation

// @TASK Phase4B - Unix domain socket orchestrator server
// @SPEC src-tauri/src/orchestrator/mod.rs + socket_server.rs

// MARK: - JSON Message Types

struct OrchestratorRequest: Codable {
    let id: String
    let action: String
    let pane_id: String?
    let name: String?
    let message: String?
    let key: String?
    let timeout_ms: UInt64?
    let instance_id: String?
}

struct OrchestratorResponse: Codable {
    let id: String
    let ok: Bool
    let data: AnyCodable?
    let error: String?

    static func success(id: String, data: Any) -> OrchestratorResponse {
        OrchestratorResponse(id: id, ok: true, data: AnyCodable(data), error: nil)
    }

    static func error(id: String, msg: String) -> OrchestratorResponse {
        OrchestratorResponse(id: id, ok: false, data: nil, error: msg)
    }
}

// MARK: - AnyCodable wrapper

struct AnyCodable: Codable {
    let value: Any

    init(_ value: Any) {
        self.value = value
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let s = try? container.decode(String.self) { value = s }
        else if let i = try? container.decode(Int.self) { value = i }
        else if let b = try? container.decode(Bool.self) { value = b }
        else if let d = try? container.decode([String: AnyCodable].self) { value = d }
        else if let a = try? container.decode([AnyCodable].self) { value = a }
        else { value = "" }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch value {
        case let s as String: try container.encode(s)
        case let i as Int: try container.encode(i)
        case let b as Bool: try container.encode(b)
        case let d as [String: Any]:
            let wrapped = d.mapValues { AnyCodable($0) }
            try container.encode(wrapped)
        case let a as [Any]:
            try container.encode(a.map { AnyCodable($0) })
        case let d as [String: String]:
            try container.encode(d)
        case let a as [[String: String]]:
            try container.encode(a)
        default:
            try container.encode("\(value)")
        }
    }
}

// MARK: - PaneInfo (for list-panes)

protocol OrchestratorDelegate: AnyObject {
    func orchestratorListPanes() -> [[String: String]]
    func orchestratorSendToPane(paneId: String, text: String) -> Bool
    func orchestratorResolveName(_ name: String) -> String?
}

// MARK: - OrchestratorServer

final class OrchestratorServer {

    let socketPath: String
    let instanceId: String

    private var serverSocket: Int32 = -1
    private var running = false
    private var acceptThread: Thread?

    weak var delegate: OrchestratorDelegate?

    init() {
        let home = FileManager.default.homeDirectoryForCurrentUser.path
        let pid = ProcessInfo.processInfo.processIdentifier
        instanceId = "\(pid)"
        socketPath = "\(home)/.clabs/sock-\(pid)"
    }

    // MARK: - Start / Stop

    func start() {
        let clabsDir = (socketPath as NSString).deletingLastPathComponent
        try? FileManager.default.createDirectory(atPath: clabsDir, withIntermediateDirectories: true)

        // Remove stale socket
        unlink(socketPath)

        // Create Unix domain socket
        serverSocket = socket(AF_UNIX, SOCK_STREAM, 0)
        guard serverSocket >= 0 else {
            NSLog("[Orchestrator] socket() failed: \(errno)")
            return
        }

        var addr = sockaddr_un()
        addr.sun_family = sa_family_t(AF_UNIX)
        let pathBytes = socketPath.utf8CString
        guard pathBytes.count <= MemoryLayout.size(ofValue: addr.sun_path) else {
            NSLog("[Orchestrator] socket path too long")
            close(serverSocket)
            return
        }
        withUnsafeMutablePointer(to: &addr.sun_path) { ptr in
            ptr.withMemoryRebound(to: CChar.self, capacity: pathBytes.count) { dest in
                for i in 0..<pathBytes.count {
                    dest[i] = pathBytes[i]
                }
            }
        }

        let addrLen = socklen_t(MemoryLayout<sockaddr_un>.size)
        let bindResult = withUnsafePointer(to: &addr) { ptr in
            ptr.withMemoryRebound(to: sockaddr.self, capacity: 1) { sockPtr in
                bind(serverSocket, sockPtr, addrLen)
            }
        }
        guard bindResult == 0 else {
            NSLog("[Orchestrator] bind() failed: \(errno)")
            close(serverSocket)
            return
        }

        // Set permissions to 0600
        chmod(socketPath, 0o600)

        guard listen(serverSocket, 5) == 0 else {
            NSLog("[Orchestrator] listen() failed: \(errno)")
            close(serverSocket)
            return
        }

        running = true

        // Install CLI
        CLIInstaller.install(socketPath: socketPath)

        // Register instance
        registerInstance()

        // Accept connections on background thread
        acceptThread = Thread {
            self.acceptLoop()
        }
        acceptThread?.name = "OrchestratorAccept"
        acceptThread?.start()

        NSLog("[Orchestrator] listening at %@", socketPath)
    }

    func stop() {
        running = false
        if serverSocket >= 0 {
            close(serverSocket)
            serverSocket = -1
        }
        unlink(socketPath)
        unregisterInstance()
        NSLog("[Orchestrator] stopped")
    }

    // MARK: - Accept Loop

    private func acceptLoop() {
        while running {
            var clientAddr = sockaddr_un()
            var clientLen = socklen_t(MemoryLayout<sockaddr_un>.size)
            let clientFd = withUnsafeMutablePointer(to: &clientAddr) { ptr in
                ptr.withMemoryRebound(to: sockaddr.self, capacity: 1) { sockPtr in
                    accept(serverSocket, sockPtr, &clientLen)
                }
            }

            guard clientFd >= 0 else {
                if running { NSLog("[Orchestrator] accept() error: \(errno)") }
                continue
            }

            // Handle each client on a dispatch queue
            DispatchQueue.global(qos: .userInitiated).async { [weak self] in
                self?.handleClient(fd: clientFd)
            }
        }
    }

    // MARK: - Client Handler

    private func handleClient(fd: Int32) {
        let file = FileHandle(fileDescriptor: fd, closeOnDealloc: true)
        defer { file.closeFile() }

        // Read line-delimited JSON
        var buffer = Data()
        while running {
            let chunk = file.availableData
            if chunk.isEmpty { break }  // EOF
            buffer.append(chunk)

            // Process complete lines
            while let newlineRange = buffer.range(of: Data([0x0A])) {
                let lineData = buffer.subdata(in: buffer.startIndex..<newlineRange.lowerBound)
                buffer.removeSubrange(buffer.startIndex...newlineRange.lowerBound)

                guard let line = String(data: lineData, encoding: .utf8), !line.isEmpty else { continue }

                let response = processRequest(line)
                if let jsonData = try? JSONEncoder().encode(response) {
                    var out = jsonData
                    out.append(0x0A)  // newline
                    file.write(out)
                }
            }
        }
    }

    // MARK: - Request Processing

    private func processRequest(_ json: String) -> OrchestratorResponse {
        guard let data = json.data(using: .utf8),
              let req = try? JSONDecoder().decode(OrchestratorRequest.self, from: data) else {
            return .error(id: "unknown", msg: "Invalid JSON")
        }

        switch req.action {
        case "list-panes":
            let panes = delegate?.orchestratorListPanes() ?? []
            return .success(id: req.id, data: ["panes": panes])

        case "send":
            guard let paneId = resolvePaneId(req) else {
                return .error(id: req.id, msg: "pane_id or name required")
            }
            guard let message = req.message else {
                return .error(id: req.id, msg: "message required")
            }
            // Dispatch to main thread for UI operations
            var sent = false
            let sem = DispatchSemaphore(value: 0)
            DispatchQueue.main.async { [weak self] in
                sent = self?.delegate?.orchestratorSendToPane(paneId: paneId, text: message) ?? false
                sem.signal()
            }
            sem.wait()
            if sent {
                return .success(id: req.id, data: ["sent": true])
            } else {
                return .error(id: req.id, msg: "Failed to send to pane \(paneId)")
            }

        case "query", "resolve":
            guard let name = req.name else {
                return .error(id: req.id, msg: "name required")
            }
            if let paneId = delegate?.orchestratorResolveName(name) {
                return .success(id: req.id, data: ["pane_id": paneId])
            } else {
                return .error(id: req.id, msg: "Name '\(name)' not found")
            }

        case "list-instances":
            let instances = Self.readInstanceRegistry()
            return .success(id: req.id, data: instances)

        default:
            return .error(id: req.id, msg: "Unknown action: \(req.action)")
        }
    }

    // MARK: - Name Resolution

    private func resolvePaneId(_ req: OrchestratorRequest) -> String? {
        if let id = req.pane_id { return id }
        if let name = req.name {
            return delegate?.orchestratorResolveName(name)
        }
        return nil
    }

    // MARK: - Instance Registry

    private func registerInstance() {
        let home = FileManager.default.homeDirectoryForCurrentUser.path
        let registryPath = "\(home)/.clabs/instances.json"

        var instances = Self.readInstanceRegistry()

        // Clean stale entries
        let staleKeys = instances.keys.filter { key in
            guard let pidStr = (instances[key] as? [String: Any])?["pid"] as? Int else { return true }
            return !Self.isPidAlive(Int32(pidStr))
        }
        for key in staleKeys {
            if let entry = instances[key] as? [String: Any], let sock = entry["socket"] as? String {
                unlink(sock)
            }
            instances.removeValue(forKey: key)
        }

        let formatter = ISO8601DateFormatter()
        instances[instanceId] = [
            "socket": socketPath,
            "pid": Int(ProcessInfo.processInfo.processIdentifier),
            "name": "",
            "started": formatter.string(from: Date())
        ] as [String: Any]

        if let data = try? JSONSerialization.data(withJSONObject: instances, options: .prettyPrinted) {
            try? data.write(to: URL(fileURLWithPath: registryPath))
        }
    }

    private func unregisterInstance() {
        let home = FileManager.default.homeDirectoryForCurrentUser.path
        let registryPath = "\(home)/.clabs/instances.json"

        var instances = Self.readInstanceRegistry()
        instances.removeValue(forKey: instanceId)

        if let data = try? JSONSerialization.data(withJSONObject: instances, options: .prettyPrinted) {
            try? data.write(to: URL(fileURLWithPath: registryPath))
        }
    }

    static func readInstanceRegistry() -> [String: Any] {
        let home = FileManager.default.homeDirectoryForCurrentUser.path
        let registryPath = "\(home)/.clabs/instances.json"

        guard let data = try? Data(contentsOf: URL(fileURLWithPath: registryPath)),
              let dict = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return [:]
        }
        return dict
    }

    static func isPidAlive(_ pid: Int32) -> Bool {
        return kill(pid, 0) == 0
    }
}
