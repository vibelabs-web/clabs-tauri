import Foundation

// @TASK Phase3A - Skill scanner for ~/.claude/skills/ directories
// @SPEC src-tauri/src/skills.rs (Rust reference implementation)

// MARK: - SkillInfo

struct SkillInfo {
    let name: String
    let description: String
    let category: String
    let filePath: String
    let trigger: String?
}

// MARK: - SkillScanner

final class SkillScanner {

    /// Primary scan: ~/.claude/skills/ + project-local .claude/skills/
    static func scan(projectPath: String? = nil) -> [SkillInfo] {
        var skills: [SkillInfo] = []
        var seen = Set<String>()

        // 1. Global skills directory
        let home = FileManager.default.homeDirectoryForCurrentUser.path
        let globalDir = (home as NSString).appendingPathComponent(".claude/skills")
        scanDirectory(globalDir, into: &skills, seen: &seen)

        // 2. Project-local skills (if provided)
        if let project = projectPath {
            let localDir = (project as NSString).appendingPathComponent(".claude/skills")
            scanDirectory(localDir, into: &skills, seen: &seen)
        }

        return skills
    }

    /// Categorize skills into groups
    static func categorize(_ skills: [SkillInfo]) -> [(category: String, skills: [SkillInfo])] {
        var map: [String: [SkillInfo]] = [:]
        for skill in skills {
            map[skill.category, default: []].append(skill)
        }

        // Fixed ordering for known categories
        let order = ["기획", "개발", "검증", "도구", "디자인", "기타"]
        var result: [(String, [SkillInfo])] = []
        for cat in order {
            if let items = map.removeValue(forKey: cat) {
                result.append((cat, items))
            }
        }
        // Remaining unknown categories
        for (cat, items) in map.sorted(by: { $0.key < $1.key }) {
            result.append((cat, items))
        }
        return result
    }

    // MARK: - Directory scanning

    private static func scanDirectory(_ dir: String, into skills: inout [SkillInfo], seen: inout Set<String>) {
        let fm = FileManager.default
        guard fm.fileExists(atPath: dir) else { return }

        guard let entries = try? fm.contentsOfDirectory(atPath: dir) else { return }

        for entry in entries {
            let entryPath = (dir as NSString).appendingPathComponent(entry)
            var isDir: ObjCBool = false
            guard fm.fileExists(atPath: entryPath, isDirectory: &isDir), isDir.boolValue else { continue }

            // Look for SKILL.md or skill.md
            let skillMd = (entryPath as NSString).appendingPathComponent("SKILL.md")
            let skillMdLower = (entryPath as NSString).appendingPathComponent("skill.md")

            let mdPath: String
            if fm.fileExists(atPath: skillMd) {
                mdPath = skillMd
            } else if fm.fileExists(atPath: skillMdLower) {
                mdPath = skillMdLower
            } else {
                continue
            }

            guard let content = try? String(contentsOfFile: mdPath, encoding: .utf8) else { continue }
            if let info = parseSkillMd(content, folderName: entry, filePath: mdPath) {
                if !seen.contains(info.name) {
                    seen.insert(info.name)
                    skills.append(info)
                }
            }
        }
    }

    // MARK: - YAML front matter parsing

    /// Parse YAML front matter between --- delimiters
    static func parseSkillMd(_ content: String, folderName: String, filePath: String) -> SkillInfo? {
        // Match --- at start of file
        guard content.hasPrefix("---") else { return nil }

        let lines = content.components(separatedBy: "\n")
        var yamlLines: [String] = []
        var foundEnd = false

        for i in 1..<lines.count {
            if lines[i].trimmingCharacters(in: .whitespaces) == "---" {
                foundEnd = true
                break
            }
            yamlLines.append(lines[i])
        }

        guard foundEnd else { return nil }

        // Simple key: value parser (matches Rust implementation)
        var metadata: [String: String] = [:]
        for line in yamlLines {
            guard let colonIdx = line.firstIndex(of: ":") else { continue }
            let key = line[line.startIndex..<colonIdx].trimmingCharacters(in: .whitespaces)
            let value = line[line.index(after: colonIdx)...].trimmingCharacters(in: .whitespaces)
            if !key.isEmpty, !value.isEmpty {
                metadata[key] = value
            }
        }

        guard let name = metadata["name"] else { return nil }
        let description = metadata["description"] ?? ""
        let trigger = metadata["trigger"]
        let category = metadata["category"] ?? inferCategory(name: name, description: description)

        return SkillInfo(
            name: name,
            description: description,
            category: category,
            filePath: filePath,
            trigger: trigger
        )
    }

    // MARK: - Category inference (matches Rust implementation)

    private static func inferCategory(name: String, description: String) -> String {
        let lowerName = name.lowercased()
        let lowerDesc = description.lowercased()

        let planning = ["socrates", "neurion", "eureka", "screen-spec", "tasks-generator", "reverse"]
        let dev = ["project-bootstrap", "auto-orchestrate", "orchestrate", "ralph-loop", "ultra-thin-orchestrate"]
        let verify = ["code-review", "trinity", "evaluation", "verification-before-completion", "powerqa", "sync"]
        let tools = ["memory", "rag", "deep-research", "chrome-browser", "packaging", "goal-setting"]

        if planning.contains(lowerName) || lowerDesc.contains("기획") || lowerDesc.contains("설계") {
            return "기획"
        }
        if dev.contains(lowerName) || lowerDesc.contains("오케스트") || lowerDesc.contains("개발") {
            return "개발"
        }
        if verify.contains(lowerName) || lowerDesc.contains("검증") || lowerDesc.contains("리뷰") || lowerDesc.contains("테스트") {
            return "검증"
        }
        if tools.contains(lowerName) || lowerDesc.contains("도구") || lowerDesc.contains("검색") {
            return "도구"
        }
        if lowerDesc.contains("디자인") || lowerDesc.contains("ui") {
            return "디자인"
        }

        return "기타"
    }
}
