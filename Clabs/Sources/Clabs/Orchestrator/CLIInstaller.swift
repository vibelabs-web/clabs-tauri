import Foundation

// @TASK Phase4B - CLI installer: writes shell script to ~/.clabs/bin/clabs

enum CLIInstaller {

    /// Install a `clabs` shell script that sends JSON messages to the orchestrator socket.
    static func install(socketPath: String) {
        let home = FileManager.default.homeDirectoryForCurrentUser.path
        let binDir = "\(home)/.clabs/bin"
        let cliPath = "\(binDir)/clabs"

        try? FileManager.default.createDirectory(atPath: binDir, withIntermediateDirectories: true)

        let script = """
        #!/usr/bin/env bash
        # clabs CLI - communicates with Clabs orchestrator via Unix socket
        # Auto-installed by Clabs.app

        SOCKET="${CLABS_SOCKET:-\(socketPath)}"

        usage() {
            echo "Usage: clabs <command> [args]"
            echo ""
            echo "Commands:"
            echo "  pane list                  List active panes"
            echo "  pane send <id> <message>   Send text to a pane"
            echo "  pane query <name>          Resolve pane name to ID"
            echo "  instances                  List running Clabs instances"
            echo ""
            echo "Socket: $SOCKET"
            exit 1
        }

        send_json() {
            local json="$1"
            if [ ! -S "$SOCKET" ]; then
                echo "Error: socket not found at $SOCKET" >&2
                exit 1
            fi
            echo "$json" | nc -U "$SOCKET"
        }

        gen_id() {
            echo "cli-$(date +%s)-$$"
        }

        case "${1:-}" in
            pane)
                case "${2:-}" in
                    list)
                        send_json "{\\\"id\\\":\\\"$(gen_id)\\\",\\\"action\\\":\\\"list-panes\\\"}"
                        ;;
                    send)
                        [ -z "${3:-}" ] || [ -z "${4:-}" ] && usage
                        PANE_ID="$3"
                        shift 3
                        MSG="$*"
                        send_json "{\\\"id\\\":\\\"$(gen_id)\\\",\\\"action\\\":\\\"send\\\",\\\"pane_id\\\":\\\"$PANE_ID\\\",\\\"message\\\":\\\"$MSG\\\"}"
                        ;;
                    query)
                        [ -z "${3:-}" ] && usage
                        send_json "{\\\"id\\\":\\\"$(gen_id)\\\",\\\"action\\\":\\\"resolve\\\",\\\"name\\\":\\\"$3\\\"}"
                        ;;
                    *) usage ;;
                esac
                ;;
            instances)
                send_json "{\\\"id\\\":\\\"$(gen_id)\\\",\\\"action\\\":\\\"list-instances\\\"}"
                ;;
            *) usage ;;
        esac
        """

        do {
            try script.write(toFile: cliPath, atomically: true, encoding: .utf8)
            // chmod +x
            let attrs: [FileAttributeKey: Any] = [.posixPermissions: 0o755]
            try FileManager.default.setAttributes(attrs, ofItemAtPath: cliPath)
            NSLog("[CLIInstaller] installed clabs CLI to %@", cliPath)
        } catch {
            NSLog("[CLIInstaller] failed to install: %@", error.localizedDescription)
        }
    }
}
