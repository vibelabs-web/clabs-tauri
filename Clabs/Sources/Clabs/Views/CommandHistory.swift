import Foundation

// @TASK Phase3C - CommandHistory: persist/retrieve command history via UserDefaults

final class CommandHistory {

    // MARK: - Types

    struct Entry: Codable {
        let command: String
        let timestamp: Date
    }

    // MARK: - Constants

    private static let defaultsKey = "clabs.commandHistory"
    private static let maxEntries = 200

    // MARK: - Singleton

    static let shared = CommandHistory()

    // MARK: - State

    private var entries: [Entry] = []

    // MARK: - Init

    private init() {
        load()
    }

    // MARK: - Public API

    /// Add a command to the history (most-recent-first). Deduplicates.
    func add(_ command: String) {
        let cmd = command.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cmd.isEmpty else { return }

        // Remove existing entry with same command (move-to-front)
        entries.removeAll { $0.command == cmd }

        // Prepend
        entries.insert(Entry(command: cmd, timestamp: Date()), at: 0)

        // Cap
        if entries.count > Self.maxEntries {
            entries = Array(entries.prefix(Self.maxEntries))
        }

        save()
    }

    /// Returns unique history entries (most-recent-first), up to `limit`.
    func list(limit: Int = 50) -> [Entry] {
        var seen = Set<String>()
        var result: [Entry] = []
        for entry in entries {
            if !seen.contains(entry.command) {
                seen.insert(entry.command)
                result.append(entry)
                if result.count >= limit { break }
            }
        }
        return result
    }

    // MARK: - Persistence

    private func load() {
        guard
            let data = UserDefaults.standard.data(forKey: Self.defaultsKey),
            let decoded = try? JSONDecoder().decode([Entry].self, from: data)
        else { return }
        entries = decoded
    }

    private func save() {
        guard let data = try? JSONEncoder().encode(entries) else { return }
        UserDefaults.standard.set(data, forKey: Self.defaultsKey)
    }
}
