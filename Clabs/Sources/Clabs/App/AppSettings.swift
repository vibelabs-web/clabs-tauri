import Foundation

// @TASK Phase4A - AppSettings: UserDefaults-backed singleton for app preferences

// MARK: - AppSettings

final class AppSettings {

    // MARK: - Singleton

    static let shared = AppSettings()
    private init() {}

    // MARK: - Keys

    private enum Key {
        static let theme             = "settings.theme"
        static let fontSize          = "settings.fontSize"
        static let defaultProjectPath = "settings.defaultProjectPath"
        static let defaultCommand    = "settings.defaultCommand"
    }

    // MARK: - Properties

    var theme: String {
        get { UserDefaults.standard.string(forKey: Key.theme) ?? "default-dark" }
        set { UserDefaults.standard.set(newValue, forKey: Key.theme) }
    }

    var fontSize: Int {
        get {
            let v = UserDefaults.standard.integer(forKey: Key.fontSize)
            return v == 0 ? 14 : v
        }
        set { UserDefaults.standard.set(newValue, forKey: Key.fontSize) }
    }

    var defaultProjectPath: String {
        get {
            UserDefaults.standard.string(forKey: Key.defaultProjectPath)
                ?? FileManager.default.homeDirectoryForCurrentUser.path
        }
        set { UserDefaults.standard.set(newValue, forKey: Key.defaultProjectPath) }
    }

    var defaultCommand: String {
        get { UserDefaults.standard.string(forKey: Key.defaultCommand) ?? "" }
        set { UserDefaults.standard.set(newValue, forKey: Key.defaultCommand) }
    }
}
