plugins {
    id("org.jetbrains.kotlin.jvm") version "2.0.21"
    id("org.jetbrains.intellij.platform") version "2.2.1"
}

group = "nl.jelle"
version = "0.1.0"

repositories {
    mavenCentral()
    intellijPlatform {
        defaultRepositories()
    }
}

dependencies {
    intellijPlatform {
        // Community Edition is enough; the plugin only uses platform APIs
        // (FileEditor, Document, JCEF) so it runs in every IntelliJ-based
        // IDE (IDEA, WebStorm, PyCharm, ...).
        intellijIdeaCommunity("2024.2.4")
    }
}

kotlin {
    jvmToolchain(21)
}

intellijPlatform {
    pluginConfiguration {
        ideaVersion {
            sinceBuild = "242"
            untilBuild = provider { null }
        }
    }
}

tasks.processResources {
    // Webview bundle is shared with the VSCode extension; build it first
    // from the repo root: `npm run build:webview`.
    from(layout.projectDirectory.dir("../vscode-extension/media/webview")) {
        into("webview")
    }
}
