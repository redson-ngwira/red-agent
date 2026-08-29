# RED AGENT — fork of DeepSeek Harness

English | [中文](README.zh.md)

**RED AGENT** (`red` / `red-agent` / `dsh`) is a hosted-agent SaaS fork of [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) — `202k stars, 23k forks` — rebranded for public `0.0.0.0:$PORT` deployment on Render.

It keeps the **everything-is-a-plugin** architecture powered by [Cordis](https://github.com/cordiverse/cordis) ([paper](https://arxiv.org/abs/2608.25512)), but defaults to `0.0.0.0:$PORT`, `__Host- Secure` cookies, browser-download file open, and `read-only` sandbox for hosted use. Fork docs: this README; upstream docs: [https://deepseek-harness.github.io/deepseek-harness/](https://deepseek-harness.github.io/deepseek-harness/)

## Developer preview

DeepSeek Harness is in _developer preview_ and iterating rapidly. **THERE WILL BE COMPATIBILITY-BREAKING CHANGES.**

Review the [safety notice](SAFETY.md) before running the project.

## Run

### Run from `npm` (upstream)

Install `Node.js`, then run: `npx @deepseek-ai/dsh web` — starts at `http://127.0.0.1:3080`.

### Run RED AGENT from source (this fork)

```sh
git clone <your-fork>/red-agent.git && cd red-agent
pnpm install
pnpm run build
pnpm red web          # or: pnpm dsh web / pnpm red-agent web
# Hosted: PORT=10000 pnpm red web --no-open  → 0.0.0.0:$PORT (Render)
```

Local still `127.0.0.1:3080` with browser; hosted auto `0.0.0.0:$PORT` with redacted token logs and `__Host- Secure` cookies. See [Web UI guide](docs/user/guide/index.md).

`pnpm run build` prepares the repository artifacts. `pnpm dsh web` uses those built artifacts without rebuilding.

## Community and support

- Submit feedback or bug reports through [GitHub Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions).
- Add the [`dsh-plugin`](https://github.com/topics/dsh-plugin) topic to your plugin repository for discoverability.
- Join <a href="https://discord.gg/Ycq5dCaS4">DeepSeek Harness Discord community</a>.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Development

Start with the [development guide](docs/development.md) and [architecture documentation](docs/architecture.md).

For agents, follow [AGENTS.md](AGENTS.md).

## License

[MIT](LICENSE)

Third-party dependencies and their licenses are disclosed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
