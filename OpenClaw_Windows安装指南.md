# OpenClaw Windows 安装与公司内部大模型对接指南

> 基于官方文档 https://docs.openclaw.ai/install 整理  
> 适用场景：公司 Windows 电脑（有 VPN），安装后对接公司内部大模型

---

## 目录

1. [系统要求](#1-系统要求)
2. [安装方式总览](#2-安装方式总览)
3. [方式一：原生 Windows 安装（推荐快速上手）](#3-方式一原生-windows-安装推荐快速上手)
4. [方式二：WSL2 安装（官方推荐，更稳定）](#4-方式二wsl2-安装官方推荐更稳定)
5. [方式三：npm/pnpm 手动安装](#5-方式三npmpnpm-手动安装)
6. [方式四：从源码构建](#6-方式四从源码构建)
7. [验证安装](#7-验证安装)
8. [Gateway 服务管理](#8-gateway-服务管理)
9. [对接公司内部大模型](#9-对接公司内部大模型)
10. [VPN 环境下的注意事项](#10-vpn-环境下的注意事项)
11. [常用命令速查](#11-常用命令速查)
12. [故障排查](#12-故障排查)
13. [更新与卸载](#13-更新与卸载)

---

## 1. 系统要求

| 项目 | 要求 |
|------|------|
| **操作系统** | Windows 10/11（原生 Windows 或 WSL2 均支持，WSL2 更稳定） |
| **Node.js** | Node 24（推荐）或 Node 22.16+（安装脚本会自动处理） |
| **pnpm** | 仅从源码构建时需要 |
| **网络** | 需要能访问 GitHub / npm registry（公司 VPN 环境需确认） |

---

## 2. 安装方式总览

| 方式 | 难度 | 适合场景 | 稳定性 |
|------|------|----------|--------|
| **PowerShell 安装脚本** | ⭐ 最简单 | 快速上手 | 良好 |
| **WSL2 安装** | ⭐⭐ 中等 | 长期使用 | ⭐⭐⭐ 最稳定 |
| **npm/pnpm 全局安装** | ⭐⭐ 中等 | 已有 Node 环境 | 良好 |
| **从源码构建** | ⭐⭐⭐ 较复杂 | 需要定制/开发 | 良好 |

> [!TIP]
> **公司内网推荐**：如果只是想快速跑起来对接内部模型，用 **方式一（PowerShell 脚本）** 最省事。如果追求长期稳定，用 **方式二（WSL2）**。

---

## 3. 方式一：原生 Windows 安装（推荐快速上手）

### 3.1 一键安装

打开 **PowerShell**（普通权限即可），运行：

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

安装脚本会自动：
- 检查 / 安装 Node.js
- 安装 OpenClaw CLI
- 运行 onboarding 引导

### 3.2 跳过 Onboarding 安装

如果你打算稍后手动配置（比如对接公司内部模型），可以跳过 onboarding：

```powershell
& ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
```

### 3.3 原生 Windows 注意事项

- `openclaw onboard --non-interactive` 需要可达的本地 Gateway，否则需要加 `--skip-health`
- Gateway 服务安装优先使用 Windows 计划任务（Scheduled Tasks），如果创建失败会自动回退到启动文件夹
- 如果 `schtasks` 卡住，OpenClaw 会自动中止并回退

---

## 4. 方式二：WSL2 安装（官方推荐，更稳定）

### 4.1 安装 WSL2 + Ubuntu

在 **管理员 PowerShell** 中运行：

```powershell
wsl --install
# 或指定发行版
wsl --list --online
wsl --install -d Ubuntu-24.04
```

安装后重启电脑，首次启动 WSL 时会要求设置用户名和密码。

### 4.2 启用 systemd（Gateway 运行必需）

在 WSL 中运行：

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

然后在 **PowerShell** 中重启 WSL：

```powershell
wsl --shutdown
```

再次打开 WSL，验证 systemd：

```bash
systemctl --user status
```

### 4.3 在 WSL 中安装 OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

或跳过 onboarding：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
```

### 4.4 从源码安装（WSL 中）

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build    # 首次运行会自动安装 UI 依赖
pnpm build
openclaw onboard
```

---

## 5. 方式三：npm/pnpm 手动安装

### 前提条件

需要已安装 Node.js 24（推荐）或 Node 22.16+。

### npm 安装

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

> 如果遇到 `sharp` 构建错误：
> ```bash
> SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
> ```

### pnpm 安装

```bash
pnpm add -g openclaw@latest
pnpm approve-builds -g
openclaw onboard --install-daemon
```

---

## 6. 方式四：从源码构建

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm ui:build && pnpm build
pnpm link --global
openclaw onboard --install-daemon
```

> [!NOTE]
> 从源码构建后，使用 `pnpm openclaw ...` 来运行命令。

---

## 7. 验证安装

安装完成后，运行以下命令确认一切正常：

```bash
# 确认 CLI 可用
openclaw --version

# 检查配置问题
openclaw doctor

# 验证 Gateway 是否运行
openclaw gateway status
```

---

## 8. Gateway 服务管理

Gateway 是 OpenClaw 的核心后台服务，负责处理所有智能体通信。

### 安装 Gateway 服务

```bash
openclaw onboard --install-daemon
# 或单独安装
openclaw gateway install
```

### 手动运行 Gateway

```bash
openclaw gateway run
```

### 查看 Gateway 状态

```bash
openclaw gateway status --json
```

### 非交互式安装（跳过健康检查）

```bash
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

---

## 9. 对接公司内部大模型

> [!IMPORTANT]
> 这是你的核心需求。OpenClaw 支持通过 **自定义 Provider** 对接任何兼容 OpenAI API 的内部大模型。

### 9.1 配置文件位置

OpenClaw 的配置文件位于：

- **Windows 原生**：`%USERPROFILE%\.openclaw\openclaw.json`
- **WSL**：`~/.openclaw/openclaw.json`

可以通过以下方式编辑：

```bash
# 交互式配置向导
openclaw configure

# 或 CLI 单行设置
openclaw config set <key> <value>

# 或直接编辑文件
# Windows: notepad %USERPROFILE%\.openclaw\openclaw.json
# WSL:     nano ~/.openclaw/openclaw.json
```

### 9.2 对接 OpenAI 兼容 API 的公司内部模型

如果公司内部大模型提供了 **OpenAI 兼容的 API**（如 vLLM、TGI、FastChat 等部署的模型），按以下配置：

编辑 `~/.openclaw/openclaw.json`：

```json5
{
  // 环境变量（API Key）
  env: {
    INTERNAL_LLM_API_KEY: "你的公司内部API密钥"
  },

  // 智能体默认配置
  agents: {
    defaults: {
      model: {
        // 设置主模型为公司内部模型
        primary: "internal-llm/你的模型名称"
      },
      models: {
        "internal-llm/你的模型名称": {
          alias: "公司内部模型"
        }
      }
    }
  },

  // 自定义 Provider 配置
  models: {
    mode: "merge",
    providers: {
      "internal-llm": {
        // 公司内部模型的 API 地址
        baseUrl: "http://你的内部模型地址:端口/v1",
        // API 密钥
        apiKey: "${INTERNAL_LLM_API_KEY}",
        // 使用 OpenAI 兼容的 Completions API
        api: "openai-completions",
        // 模型目录
        models: [
          {
            id: "你的模型名称",
            name: "公司内部模型显示名",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 32000
          }
        ]
      }
    }
  }
}
```

### 9.3 配置参数说明

| 参数 | 说明 | 示例 |
|------|------|------|
| `baseUrl` | 公司内部模型的 API 端点 | `http://10.0.1.100:8000/v1` |
| `apiKey` | 访问密钥（如果不需要可设为任意值） | `sk-internal-xxx` |
| `api` | API 协议类型 | `openai-completions`（最常用）<br>`openai-responses`<br>`anthropic-messages`<br>`google-generative-ai` |
| `id` | 模型标识（需与 API 中的模型名一致） | `qwen2-72b-chat` |
| `contextWindow` | 模型上下文窗口大小 | `128000` |
| `maxTokens` | 最大输出 token 数 | `32000` |

### 9.4 具体场景示例

#### 场景 A：对接 vLLM 部署的 Qwen 模型

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "company-vllm/qwen2.5-72b-instruct"
      },
      models: {
        "company-vllm/qwen2.5-72b-instruct": { alias: "Qwen2.5-72B" }
      }
    }
  },
  models: {
    mode: "merge",
    providers: {
      "company-vllm": {
        baseUrl: "http://10.0.1.100:8000/v1",
        apiKey: "token-xxx",
        api: "openai-completions",
        models: [
          {
            id: "qwen2.5-72b-instruct",
            name: "Qwen2.5 72B Instruct",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 8192
          }
        ]
      }
    }
  }
}
```

#### 场景 B：对接 LiteLLM 代理的多个内部模型

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "litellm-proxy/deepseek-v3",
        fallbacks: ["litellm-proxy/qwen2.5-72b"]
      },
      models: {
        "litellm-proxy/deepseek-v3": { alias: "DeepSeek V3" },
        "litellm-proxy/qwen2.5-72b": { alias: "Qwen2.5 72B" }
      }
    }
  },
  models: {
    mode: "merge",
    providers: {
      "litellm-proxy": {
        baseUrl: "http://litellm.internal.company.com:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3",
            name: "DeepSeek V3",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 32000
          },
          {
            id: "qwen2.5-72b",
            name: "Qwen2.5 72B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 8192
          }
        ]
      }
    }
  }
}
```

#### 场景 C：对接本地 Ollama 模型

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/qwen2.5:72b"
      },
      models: {
        "ollama/qwen2.5:72b": { alias: "Qwen2.5 Local" }
      }
    }
  }
}
```

> Ollama 是内置支持的 Provider，无需配置 `models.providers`。

### 9.5 验证模型连接

配置完成后，重启 Gateway 并验证：

```bash
# 重启 Gateway 使配置生效（配置支持热重载，但首次建议重启）
openclaw gateway restart

# 检查配置
openclaw doctor

# 快速测试模型连接
openclaw agent --local --agent main --thinking low -m "你好，请回复OK"
```

### 9.6 环境变量方式配置 API Key

除了写在配置文件中，还可以使用环境变量：

**方式 1：`.env` 文件**

创建 `~/.openclaw/.env`：

```ini
INTERNAL_LLM_API_KEY=sk-your-key-here
```

**方式 2：系统环境变量**

```powershell
# PowerShell
$env:INTERNAL_LLM_API_KEY = "sk-your-key-here"
# 或永久设置
[System.Environment]::SetEnvironmentVariable("INTERNAL_LLM_API_KEY", "sk-your-key-here", "User")
```

---

## 10. VPN 环境下的注意事项

> [!WARNING]
> 公司 VPN 环境可能影响安装和运行，以下是需要关注的要点。

### 10.1 安装阶段

| 问题 | 解决方案 |
|------|----------|
| 无法下载安装脚本 | 确保 VPN 可访问 `openclaw.ai` 和 `github.com` |
| npm 安装超时 | 配置 npm 代理：`npm config set proxy http://代理地址:端口` |
| Git clone 失败 | 配置 Git 代理：`git config --global http.proxy http://代理地址:端口` |
| SSL 证书问题 | ⚠️ 某些公司 VPN 会替换 SSL 证书。可能需要：`npm config set strict-ssl false`（不推荐，仅限安装时临时使用） |

### 10.2 npm/pnpm 代理配置

```bash
# 设置 npm 代理
npm config set proxy http://公司代理地址:端口
npm config set https-proxy http://公司代理地址:端口

# 设置 npm 镜像源（国内加速）
npm config set registry https://registry.npmmirror.com
```

### 10.3 运行阶段

- **内部模型地址**：确保配置中的 `baseUrl` 在 VPN 环境下可达
- **Gateway 端口**：默认使用 `127.0.0.1:18789`，通常不受 VPN 影响
- **DNS 解析**：如果内部模型使用域名，确认 VPN 的 DNS 可以解析

### 10.4 WSL2 + VPN 特殊问题

WSL2 在 VPN 环境下可能有网络隔离问题：

```powershell
# 如果 WSL2 无法连网，尝试以下命令（管理员 PowerShell）
wsl --shutdown
# 然后重新打开 WSL
```

如果持续有问题，可以在 WSL 中配置 DNS：

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
[network]
generateResolvConf=false
EOF

sudo rm /etc/resolv.conf
sudo tee /etc/resolv.conf >/dev/null <<'EOF'
nameserver 公司DNS地址
nameserver 8.8.8.8
EOF
```

---

## 11. 常用命令速查

```bash
# === 安装与配置 ===
openclaw --version             # 查看版本
openclaw doctor                # 诊断问题
openclaw doctor --fix          # 自动修复问题
openclaw configure             # 交互式配置向导
openclaw onboard               # 全流程引导

# === Gateway 管理 ===
openclaw gateway install       # 安装 Gateway 服务
openclaw gateway run           # 手动运行 Gateway
openclaw gateway status        # 查看 Gateway 状态
openclaw gateway status --json # JSON 格式状态

# === 配置管理 ===
openclaw config get <key>      # 获取配置项
openclaw config set <key> <val># 设置配置项
openclaw config unset <key>    # 删除配置项

# === 模型与智能体 ===
openclaw agent --local --agent main -m "消息"  # 发送消息
openclaw plugins list --json                     # 查看已安装插件

# === 健康检查 ===
openclaw health                # 健康检查
openclaw status --all          # 全部状态
openclaw logs                  # 查看日志
```

---

## 12. 故障排查

### 12.1 `openclaw` 命令未找到

```bash
# 检查 Node 是否安装
node -v

# 检查全局包目录
npm prefix -g

# 检查 PATH（Linux/WSL）
echo "$PATH"

# 确保全局 bin 目录在 PATH 中
# 在 ~/.zshrc 或 ~/.bashrc 中添加：
export PATH="$(npm prefix -g)/bin:$PATH"
```

**Windows PowerShell**：确认 npm 全局目录在系统 PATH 中。

### 12.2 Gateway 无法启动

```bash
openclaw doctor          # 查看具体问题
openclaw doctor --fix    # 尝试自动修复
openclaw logs            # 查看错误日志
```

### 12.3 无法连接内部模型

1. 确认模型服务地址可达：`curl http://模型地址:端口/v1/models`
2. 确认 API Key 正确
3. 确认 `api` 字段匹配模型的 API 协议类型
4. 检查 VPN 是否连接
5. 查看 OpenClaw 日志：`openclaw logs`

### 12.4 sharp 模块构建错误

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

---

## 13. 更新与卸载

### 更新

参考 [官方更新文档](https://docs.openclaw.ai/install/updating)：

```bash
# npm 更新
npm install -g openclaw@latest

# 或重新运行安装脚本
```

### 卸载

参考 [官方卸载文档](https://docs.openclaw.ai/install/uninstall)

---

## 附录：推荐安装流程（快速上手）

以下是针对你的场景（Windows + VPN + 公司内部大模型）的**推荐操作步骤**：

```
第 1 步：打开 PowerShell
第 2 步：运行安装脚本（跳过 onboarding）
         & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
第 3 步：验证安装
         openclaw --version
第 4 步：安装 Gateway 服务
         openclaw gateway install
第 5 步：编辑配置文件，添加公司内部模型
         notepad $env:USERPROFILE\.openclaw\openclaw.json
         （参考第 9 节的配置模板）
第 6 步：启动 Gateway
         openclaw gateway run
第 7 步：验证连接
         openclaw doctor
         openclaw agent --local --agent main --thinking low -m "你好"
```

---

> **相关链接**
> - 📖 [OpenClaw 官方文档](https://docs.openclaw.ai)
> - 🔧 [安装指南](https://docs.openclaw.ai/install)
> - 💻 [Windows 平台指南](https://docs.openclaw.ai/platforms/windows)
> - 🤖 [模型 Provider 目录](https://docs.openclaw.ai/providers)
> - ⚙️ [配置参考](https://docs.openclaw.ai/gateway/configuration-reference)
> - 🔌 [自定义 Provider 设置](https://docs.openclaw.ai/gateway/configuration-reference#custom-providers-and-base-urls)
