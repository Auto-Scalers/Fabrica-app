cask "fabrica" do
  arch arm: "arm64", intel: "x64"

  version "1.3.24"
  sha256 arm:   "fc707f290ff3b631b7b7947bf339885b61a43d2e89475997c125b61268ed4966",
         intel: "5f677c13a08f7a5740442e29d388285a86488c8c1f7aa5f10a8721a2c6ede8e4"

  url "https://github.com/Auto-Scalers/fabrica/releases/download/v#{version}/fabrica-macos-#{arch}.dmg",
      verified: "github.com/Auto-Scalers/fabrica/"
  name "Fabrica"
  desc "IDE for orchestrating AI coding agents across terminals and worktrees"
  homepage "https://fabrica-ai.vercel.app"

  livecheck do
    url :url
    strategy :github_latest
  end

  # Why: electron-updater (src/main/updater.ts) handles in-place updates by
  # writing a new Fabrica.app into /Applications. Marking the cask auto_updates
  # tells Homebrew not to compete with the in-app updater — `brew upgrade`
  # becomes a no-op unless the user passes --greedy, and brew's version
  # metadata stays aligned with whatever the app has swapped itself to.
  auto_updates true
  conflicts_with cask: "fabrica@rc"
  depends_on macos: :big_sur

  app "Fabrica.app"

  # Why: expose the bundled `fabrica` CLI on PATH at install time (Homebrew symlinks
  # this into its already-on-PATH bin dir). Without it, the CLI is only registered
  # by the in-app "Install CLI" action, which a headless host can never trigger —
  # so `fabrica serve` on a server would be unreachable from the shell. The shim
  # resolves the real app by walking symlinks, so the Homebrew symlink works.
  binary "#{appdir}/Fabrica.app/Contents/Resources/bin/fabrica"

  # Why: Fabrica writes user data under ~/.fabrica (worktrees, agent state) and
  # Electron's standard userData directories. Zap removes everything the app
  # creates during normal use so `brew uninstall --zap` is a clean slate.
  zap trash: [
    "~/.fabrica",
    "~/Library/Application Support/Fabrica",
    "~/Library/Caches/ai.autoscalers.fabrica",
    "~/Library/Caches/ai.autoscalers.fabrica.ShipIt",
    "~/Library/HTTPStorages/ai.autoscalers.fabrica",
    "~/Library/Preferences/ai.autoscalers.fabrica.plist",
    "~/Library/Saved Application State/ai.autoscalers.fabrica.savedState",
  ]
end
