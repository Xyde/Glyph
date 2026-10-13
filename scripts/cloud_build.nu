#!/usr/bin/env nu

# Cloud build automation script for Glyph
def main [] {
    print "=== 1. Checking GitHub CLI Auth ==="
    let auth = (do { gh auth status } | complete)
    if $auth.exit_code != 0 {
        print "Error: gh is not authenticated. Please authenticate first."
        exit 1
    }
    print "Authenticated as Xyde."

    print "\n=== 2. Headless Forking SidhuK/Glyph ==="
    do { gh repo fork SidhuK/Glyph --clone=false } | complete
    print "Fork verified/created under Xyde/Glyph."

    print "\n=== 3. Pushing cloud-build bookmark via Jujutsu ==="
    jj git push --remote myfork -b cloud-build
    print "Pushed cloud-build bookmark to myfork."

    print "\n=== 4. Dispatching GitHub Actions Cloud Workflow ==="
    gh workflow run "Build Community macOS App" --ref cloud-build -R Xyde/Glyph
    print "Workflow triggered on GitHub Actions (Apple Silicon macos-latest runner)."

    print "\n=== 5. Watching Cloud Build Stream ==="
    gh run watch -R Xyde/Glyph

    print "\n=== 6. Downloading Compiled Community Bundle ==="
    mkdir dist
    gh run download -R Xyde/Glyph -n Glyph-Community-macOS -D dist
    print "Artifact downloaded into ./dist/."

    print "\n=== 7. Stripping Quarantine Attribute ==="
    if ("dist/Glyph.app" | path exists) {
        xattr -cr dist/Glyph.app
        print "Cleared com.apple.quarantine from dist/Glyph.app."
    }

    print "\nDone! Community build compiled remotely and downloaded without internal SSD compilation writes."
}
