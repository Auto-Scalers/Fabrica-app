<h1 align="center">
  <a href="https://fabrica-ai.vercel.app"><img src="../../resources/build/icon.png" alt="Fabrica" width="64" valign="middle" /></a> Fabrica
</h1>

<p align="center">
  <a href="https://github.com/Auto-Scalers/Fabrica-app"><img src="https://badgen.net/github/stars/Auto-Scalers/Fabrica-app?label=%E2%98%85" alt="Étoiles GitHub" /></a>
  <a href="https://github.com/Auto-Scalers/Fabrica-app/releases"><img src="../assets/readme-downloads.svg" alt="Téléchargements totaux sur toutes les versions" /></a>
  <img src="https://badgen.net/github/license/Auto-Scalers/Fabrica-app" alt="Licence" />
  <a href="https://discord.gg/fzjDKHxv8Q"><img src="https://img.shields.io/badge/Discord-5865F2?logo=discord&logoColor=white" alt="Rejoindre le Discord Fabrica" /></a>
  <a href="https://x.com/fabrica_build"><img src="https://img.shields.io/badge/X-000000?logo=x&logoColor=white" alt="Suivre Fabrica sur X" /></a>
  <img src="https://img.shields.io/badge/macOS%20%7C%20Windows%20%7C%20Linux-4493F8?style=flat-square" alt="Plateformes prises en charge : macOS, Windows et Linux" />
</p>

<p align="center">
  <sub><a href="../../README.md">English</a> · <a href="README.zh-CN.md">中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.es.md">Español</a> · <a href="README.pt.md">Português</a></sub>
</p>

<p align="center">
  <strong>L'orchestrateur d'IA pour les builders 100x.</strong><br/>
  Lancez Codex, Claude Code, OpenCode ou Pi côte à côte — chacun dans son propre worktree, le tout suivi au même endroit.
</p>

<h3 align="center"><a href="https://fabrica-ai.vercel.app/download"><ins>Télécharger Fabrica</ins></a></h3>

<p align="center">
  <sub>Sous Windows ? Prenez la <a href="https://github.com/Auto-Scalers/Fabrica-app/releases#release-v1.4.147-rc.3">dernière RC</a> — elle inclut des correctifs Windows.</sub>
</p>

<p align="center">
  <img src="../assets/readme-hero.jpg" alt="Application de bureau Fabrica exécutant des agents dans des worktrees parallèles, avec l'app companion mobile Fabrica dans le coin" width="960" />
</p>

## Fonctionnalités

<table>
<tr>
<td width="50%" valign="middle">

### Companion mobile

Surveillez et pilotez vos agents depuis votre téléphone — soyez notifié quand un agent termine, et envoyez des instructions de suivi où que vous soyez.

[App Store iOS](https://apps.apple.com/us/app/fabrica-ide/id6766130217) · [TestFlight](https://testflight.apple.com/join/YjeGMQBA) · [APK Android 0.0.37](https://github.com/Auto-Scalers/Fabrica-app/releases/download/mobile-android-v0.0.37/app-release.apk) · [Docs →](https://fabrica-ai.vercel.app/docs/mobile)

</td>
<td width="50%">
  <a href="https://fabrica-ai.vercel.app/docs/mobile"><picture><source srcset="../assets/feature-wall/mobile-companion-app-showcase.gif" type="image/gif"><img src="../assets/feature-wall/mobile-companion-app-showcase.jpg" alt="Fabrica desktop avec l'app companion mobile" width="100%" /></picture></a>
</td>
</tr>
<tr>
<td width="50%" valign="middle">

### Worktrees parallèles

Lancez un même prompt sur cinq agents, chacun dans son propre worktree git isolé — comparez les résultats et mergez le gagnant.

[Docs →](https://fabrica-ai.vercel.app/docs/model/worktrees)

</td>
<td width="50%">
  <a href="https://fabrica-ai.vercel.app/docs/model/worktrees"><picture><source srcset="../assets/feature-wall/parallel-worktrees.gif" type="image/gif"><img src="../assets/feature-wall/parallel-worktrees.jpg" alt="Orchestration de worktrees parallèles" width="100%" /></picture></a>
</td>
</tr>
<tr>
<td width="50%" valign="middle">

### Splits de terminal

Terminaux de niveau Ghostty avec rendu WebGL, splits infinis et un scrollback qui survit aux redémarrages.

[Docs →](https://fabrica-ai.vercel.app/docs/terminal)

</td>
<td width="50%">
  <a href="https://fabrica-ai.vercel.app/docs/terminal"><picture><source srcset="../assets/feature-wall/terminal-splits.gif" type="image/gif"><img src="../assets/feature-wall/terminal-splits.jpg" alt="Splits de terminal" width="100%" /></picture></a>
</td>
</tr>
<tr>
<td width="50%" valign="middle">

### Mode Design

Cliquez sur n'importe quel élément d'UI dans une vraie fenêtre Chromium pour envoyer son HTML, son CSS et une capture recadrée directement dans le prompt de votre agent.

[Docs →](https://fabrica-ai.vercel.app/docs/browser/design-mode)

</td>
<td width="50%">
  <a href="https://fabrica-ai.vercel.app/docs/browser/design-mode"><picture><source srcset="../assets/feature-wall/design-mode.gif" type="image/gif"><img src="../assets/feature-wall/design-mode.jpg" alt="Navigateur intégré et Mode Design" width="100%" /></picture></a>
</td>
</tr>
<tr>
<td width="50%" valign="middle">

### GitHub &amp; Linear, natifs

Parcourez PRs, issues et boards de projet dans l'app — ouvrez un worktree depuis n'importe quelle tâche et reviewz sans changer de contexte.

[Docs →](https://fabrica-ai.vercel.app/docs/review/linear)

</td>
<td width="50%">
  <a href="https://fabrica-ai.vercel.app/docs/review/linear"><picture><source srcset="../assets/feature-wall/github-linear.gif" type="image/gif"><img src="../assets/feature-wall/github-linear.jpg" alt="Workflows GitHub et Linear dans Fabrica" width="100%" /></picture></a>
</td>
</tr>
<tr>
<td width="50%" valign="middle">

### Worktrees SSH

Faites tourner des agents sur une machine distante costaude, avec édition de fichiers, git et terminaux complets — reconnexion auto et port forwarding inclus.

[Docs →](https://fabrica-ai.vercel.app/docs/ssh)

</td>
<td width="50%">
  <a href="https://fabrica-ai.vercel.app/docs/ssh"><picture><source srcset="../assets/feature-wall/ssh-worktrees.gif" type="image/gif"><img src="../assets/feature-wall/ssh-worktrees.jpg" alt="Worktrees distants via SSH" width="100%" /></picture></a>
</td>
</tr>
<tr>
<td width="50%" valign="middle">

### Annoter les diffs IA

Posez des commentaires sur n'importe quelle ligne de diff et renvoyez-les à l'agent — review, édition et commit sans quitter Fabrica.

[Docs →](https://fabrica-ai.vercel.app/docs/review/annotate-ai-diff)

</td>
<td width="50%">
  <a href="https://fabrica-ai.vercel.app/docs/review/annotate-ai-diff"><picture><source srcset="../assets/feature-wall/annotate-diff.gif" type="image/gif"><img src="../assets/feature-wall/annotate-diff.jpg" alt="Annoter les diffs générés par l'IA" width="100%" /></picture></a>
</td>
</tr>
<tr>
<td width="50%" valign="middle">

### Glisser-déposer vers les agents

L'éditeur VS Code avec autosave partout — glissez fichiers ou images directement dans le prompt d'un agent.

[Docs →](https://fabrica-ai.vercel.app/docs/editing/file-explorer)

</td>
<td width="50%">
  <a href="https://fabrica-ai.vercel.app/docs/editing/file-explorer"><picture><source srcset="../assets/feature-wall/file-drag.gif" type="image/gif"><img src="../assets/feature-wall/file-drag.jpg" alt="Glisser des fichiers et images dans le prompt d'un agent" width="100%" /></picture></a>
</td>
</tr>
<tr>
<td width="50%" valign="middle">

### Fabrica CLI

Les agents pilotent aussi Fabrica — scriptez n'importe quel workflow avec `fabrica worktree create`, `snapshot`, `click` et `fill`.

[Docs →](https://fabrica-ai.vercel.app/docs/cli/overview)

</td>
<td width="50%">
  <a href="https://fabrica-ai.vercel.app/docs/cli/overview"><picture><source srcset="../assets/feature-wall/fabrica-cli.gif" type="image/gif"><img src="../assets/feature-wall/fabrica-cli.jpg" alt="Scripter Fabrica depuis la CLI" width="100%" /></picture></a>
</td>
</tr>
</table>

**Aussi dans la boîte :**

- **[Quick open](https://fabrica-ai.vercel.app/docs/model/quick-open)** — Cherchez parmi worktrees, fichiers, agents, commandes et contexte du repo sans quitter votre flow.
- **[Sélecteur de comptes &amp; suivi d'usage](https://fabrica-ai.vercel.app/docs/agents/usage-tracking)** — Suivez l'usage Claude et Codex et les resets de rate limit, et basculez de compte à chaud sans vous reconnecter.
- **[Aperçus riches du repo](https://fabrica-ai.vercel.app/docs/editing/markdown)** — Prévisualisez Markdown, images, PDF et docs du repo dans le workspace.
- **[Computer Use](https://fabrica-ai.vercel.app/docs/cli/computer-use)** — Laissez les agents piloter des apps desktop et l'UI visible quand un workflow demande une vraie interaction.
- **[Notifications et non-lus](https://fabrica-ai.vercel.app/docs/notifications)** — Sachez quand un agent termine ou a besoin d'attention, puis marquez des fils comme non lus pour y revenir plus tard.
- **Et bien plus encore** — on ship tous les jours, donc cette liste est toujours en retard. Le [changelog](https://github.com/Auto-Scalers/Fabrica-app/releases) est la vraie liste des features.

---

## Agents pris en charge

Fonctionne avec **n'importe quel agent CLI** — s'il tourne dans un terminal, il tourne dans Fabrica.

<p>
  <a href="https://docs.anthropic.com/claude/docs/claude-code"><kbd><img src="../assets/claude-logo.svg" alt="Logo Claude Code" width="16" valign="middle" /> Claude Code</kbd></a> &nbsp;
  <a href="https://github.com/openai/codex"><kbd><img src="https://www.google.com/s2/favicons?domain=openai.com&sz=64" alt="Logo Codex" width="16" valign="middle" /> Codex</kbd></a> &nbsp;
  <a href="https://x.ai/cli"><kbd><img src="https://www.google.com/s2/favicons?domain=x.ai&sz=64" alt="Logo Grok" width="16" valign="middle" /> Grok</kbd></a> &nbsp;
  <a href="https://cursor.com/cli"><kbd><img src="https://www.google.com/s2/favicons?domain=cursor.com&sz=64" alt="Logo Cursor" width="16" valign="middle" /> Cursor</kbd></a> &nbsp;
  <a href="https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli"><kbd><img src="https://www.google.com/s2/favicons?domain=github.com&sz=64" alt="Logo GitHub Copilot" width="16" valign="middle" /> GitHub Copilot</kbd></a> &nbsp;
  <a href="https://opencode.ai/docs/cli/"><kbd><img src="https://www.google.com/s2/favicons?domain=opencode.ai&sz=64" alt="Logo OpenCode" width="16" valign="middle" /> OpenCode</kbd></a> &nbsp;
  <a href="https://mimo.xiaomi.com/coder"><kbd><img src="https://www.google.com/s2/favicons?domain=mimo.xiaomi.com&sz=64" alt="Logo MiMo Code" width="16" valign="middle" /> MiMo Code</kbd></a> &nbsp;
  <a href="https://ampcode.com/manual#install"><kbd><img src="https://www.google.com/s2/favicons?domain=ampcode.com&sz=64" alt="Logo Amp" width="16" valign="middle" /> Amp</kbd></a> &nbsp;
  <a href="https://openclaude.gitlawb.com/"><kbd><img src="../../resources/openclaude-logo.png" alt="Logo OpenClaude" width="16" valign="middle" /> OpenClaude</kbd></a> &nbsp;
  <a href="https://antigravity.google/docs/cli-overview"><kbd><img src="https://www.google.com/s2/favicons?domain=antigravity.google&sz=64" alt="Logo Antigravity" width="16" valign="middle" /> Antigravity</kbd></a> &nbsp;
  <a href="https://pi.dev"><kbd><img src="https://pi.dev/favicon.svg" alt="Logo Pi" width="16" valign="middle" /> Pi</kbd></a> &nbsp;
  <a href="https://omp.sh"><kbd><img src="https://omp.sh/favicon.svg" alt="Logo oh-my-pi" width="16" valign="middle" /> oh-my-pi</kbd></a> &nbsp;
  <a href="https://hermes-agent.nousresearch.com/docs/"><kbd><img src="https://www.google.com/s2/favicons?domain=nousresearch.com&sz=64" alt="Logo Hermes Agent" width="16" valign="middle" /> Hermes Agent</kbd></a> &nbsp;
  <a href="https://devin.ai/cli"><kbd><img src="https://www.google.com/s2/favicons?domain=devin.ai&sz=64" alt="Logo Devin" width="16" valign="middle" /> Devin</kbd></a> &nbsp;
  <a href="https://block.github.io/goose/docs/quickstart/"><kbd><img src="https://www.google.com/s2/favicons?domain=goose-docs.ai&sz=64" alt="Logo Goose" width="16" valign="middle" /> Goose</kbd></a> &nbsp;
  <a href="https://docs.augmentcode.com/cli/overview"><kbd><img src="https://www.google.com/s2/favicons?domain=augmentcode.com&sz=64" alt="Logo Auggie" width="16" valign="middle" /> Auggie</kbd></a> &nbsp;
  <a href="https://github.com/autohandai/code-cli"><kbd><img src="https://www.google.com/s2/favicons?domain=autohand.ai&sz=64" alt="Logo Autohand Code" width="16" valign="middle" /> Autohand Code</kbd></a> &nbsp;
  <a href="https://github.com/charmbracelet/crush"><kbd><img src="https://www.google.com/s2/favicons?domain=charm.sh&sz=64" alt="Logo Charm" width="16" valign="middle" /> Charm</kbd></a> &nbsp;
  <a href="https://docs.cline.bot/cline-cli/overview"><kbd><img src="https://www.google.com/s2/favicons?domain=cline.bot&sz=64" alt="Logo Cline" width="16" valign="middle" /> Cline</kbd></a> &nbsp;
  <a href="https://www.codebuff.com/docs/help/quick-start"><kbd><img src="https://www.google.com/s2/favicons?domain=codebuff.com&sz=64" alt="Logo Codebuff" width="16" valign="middle" /> Codebuff</kbd></a> &nbsp;
  <a href="https://commandcode.ai/docs/quickstart"><kbd><img src="https://www.google.com/s2/favicons?domain=commandcode.ai&sz=64" alt="Logo Command Code" width="16" valign="middle" /> Command Code</kbd></a> &nbsp;
  <a href="https://docs.continue.dev/guides/cli"><kbd><img src="https://www.google.com/s2/favicons?domain=continue.dev&sz=64" alt="Logo Continue" width="16" valign="middle" /> Continue</kbd></a> &nbsp;
  <a href="https://docs.factory.ai/cli/getting-started/quickstart"><kbd><img src="../assets/droid-logo.svg" alt="Logo Droid" width="16" valign="middle" /> Droid</kbd></a> &nbsp;
  <a href="https://kilo.ai/docs/cli"><kbd><img src="https://raw.githubusercontent.com/Kilo-Org/kilocode/main/packages/kilo-vscode/assets/icons/kilo-light.svg" alt="Logo Kilocode" width="16" valign="middle" /> Kilocode</kbd></a> &nbsp;
  <a href="https://www.kimi.com/code/docs/en/kimi-code-cli/getting-started.html"><kbd><img src="https://www.google.com/s2/favicons?domain=moonshot.cn&sz=64" alt="Logo Kimi" width="16" valign="middle" /> Kimi</kbd></a> &nbsp;
  <a href="https://kiro.dev/docs/cli/"><kbd><img src="https://www.google.com/s2/favicons?domain=kiro.dev&sz=64" alt="Logo Kiro" width="16" valign="middle" /> Kiro</kbd></a> &nbsp;
  <a href="https://github.com/mistralai/mistral-vibe"><kbd><img src="https://www.google.com/s2/favicons?domain=mistral.ai&sz=64" alt="Logo Mistral Vibe" width="16" valign="middle" /> Mistral Vibe</kbd></a> &nbsp;
  <a href="https://github.com/QwenLM/qwen-code"><kbd><img src="https://www.google.com/s2/favicons?domain=qwenlm.github.io&sz=64" alt="Logo Qwen Code" width="16" valign="middle" /> Qwen Code</kbd></a> &nbsp;
  <a href="https://support.atlassian.com/rovo/docs/install-and-run-rovo-dev-cli-on-your-device/"><kbd><img src="https://www.google.com/s2/favicons?domain=atlassian.com&sz=64" alt="Logo Rovo Dev" width="16" valign="middle" /> Rovo Dev</kbd></a> &nbsp;
  <kbd>+ n'importe quel agent CLI</kbd>
</p>

---

## Installation

### Desktop — macOS, Windows, Linux

- **[Télécharger depuis Fabrica](https://fabrica-ai.vercel.app/download)**
- Ou récupérez un build directement : [macOS Apple Silicon](https://github.com/Auto-Scalers/Fabrica-app/releases/latest/download/fabrica-macos-arm64.dmg) · [macOS Intel](https://github.com/Auto-Scalers/Fabrica-app/releases/latest/download/fabrica-macos-x64.dmg) · [Windows (.exe)](https://github.com/Auto-Scalers/Fabrica-app/releases/download/v1.4.147-rc.3/fabrica-windows-setup.exe) · [Linux AppImage](https://github.com/Auto-Scalers/Fabrica-app/releases/latest/download/fabrica-linux.AppImage) · [Tous les builds](https://github.com/Auto-Scalers/Fabrica-app/releases/latest)
- **Sous Windows :** utilisez la [dernière RC (`v1.4.147-rc.3`)](https://github.com/Auto-Scalers/Fabrica-app/releases#release-v1.4.147-rc.3) — elle inclut des correctifs Windows absents de la stable.
- Vous lancez `fabrica serve` sur un serveur Linux headless ? Consultez le [guide serveur Linux headless](../reference/headless-linux-server.md).

_Ou via un gestionnaire de paquets :_

```bash
# macOS (Homebrew)
brew install --cask Auto-Scalers/Fabrica-app/fabrica

# Arch Linux (AUR) — ou fabrica-git pour compiler depuis les sources
yay -S fabrica-bin
```

### Companion mobile — iOS, Android

Associez-la à l'app de bureau pour surveiller et piloter vos agents depuis votre téléphone.

- **iOS :** [Télécharger sur l'App Store](https://apps.apple.com/us/app/fabrica-ide/id6766130217) ou [rejoindre TestFlight](https://testflight.apple.com/join/YjeGMQBA)
- **Android :** [Télécharger l'APK 0.0.37](https://github.com/Auto-Scalers/Fabrica-app/releases/download/mobile-android-v0.0.37/app-release.apk)

---

## Communauté &amp; support

- **Discord :** Rejoignez la communauté sur **[Discord](https://discord.gg/fzjDKHxv8Q)**.
- **Twitter / X :** Suivez **[@fabrica_build](https://x.com/fabrica_build)** pour les news et annonces.
- **WeChat :** Scannez pour rejoindre le groupe WeChat 7 de la communauté Fabrica.

  <img src="../assets/wechat-qr-group7.jpg" alt="QR code WeChat groupe 7 de la communauté Fabrica" width="160" />

- **Feedback &amp; idées :** On ship vite. Il manque quelque chose ? [Demandez une feature](https://github.com/Auto-Scalers/Fabrica-app/issues).
- **Confidentialité :** Voir la [doc confidentialité &amp; télémétrie](https://fabrica-ai.vercel.app/docs/telemetry) pour ce qu'Fabrica collecte en anonyme et comment désactiver la télémétrie.
- **Soutenez-nous :** [Mettez une star](https://github.com/Auto-Scalers/Fabrica-app) sur ce repo pour suivre nos ships quotidiens.

---

## Développement

Envie de contribuer ou de lancer le projet en local ? Consultez notre guide [CONTRIBUTING.md](../../.github/CONTRIBUTING.md).

<a href="https://github.com/Auto-Scalers/Fabrica-app/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Auto-Scalers/Fabrica-app" alt="Contributeurs Fabrica" />
</a>

<p align="center">
  <img src="../assets/star-history.png" alt="Graphique d'historique des étoiles GitHub pour Auto-Scalers/Fabrica-app" width="880" />
</p>

## Builds signés

Signature de code Windows sponsorisée / fournie par [SignPath.io](https://signpath.io), certificat par [SignPath Foundation](https://signpath.org).

## Licence

Fabrica est libre et open source sous la [licence MIT](../../LICENSE).
