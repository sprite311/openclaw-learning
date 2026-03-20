# OpenClaw Windows 安装与使用指南

> OpenClaw 2026.3.14 — 已从源码预构建，解压即可使用  
> 适用场景：公司 Windows 电脑，对接公司内部大模型

---

## 目录

1. [快速开始（3 步上手）](#1-快速开始3-步上手)
2. [前提条件](#2-前提条件)
3. [目录结构说明](#3-目录结构说明)
4. [启动与使用](#4-启动与使用)
5. [访问 Control UI（Web 管理界面）](#5-访问-control-ui-web-管理界面)
6. [对接公司内部大模型](#6-对接公司内部大模型)
7. [常用命令速查](#7-常用命令速查)
8. [故障排查](#8-故障排查)
9. [VPN 环境注意事项](#9-vpn-环境注意事项)
10. [更新 OpenClaw](#10-更新-openclaw)

---

## 1. 快速开始（3 步上手）

```
第 1 步：确认电脑已安装 Node.js 22.16+（命令行运行 node -v 检查）
        如未安装，下载地址：https://nodejs.org/

第 2 步：解压本文件夹到任意目录

第 3 步：打开 PowerShell，运行：
        .\run_openclaw.ps1 --version
        看到 "OpenClaw 2026.3.14" 即表示可用
```

---

## 2. 前提条件

| 项目 | 要求 |
| ---- | ---- |
| **操作系统** | Windows 10 / 11 |
| **Node.js** | **22.16 或更高版本**（必须安装） |
| **其他** | 无需安装 npm、pnpm 等工具，所有依赖已包含在包内 |

### 安装 Node.js

如果目标电脑没有 Node.js，下载安装即可：

- 官方下载：https://nodejs.org/
- 推荐版本：Node 24 LTS 或 Node 22 LTS

安装时勾选 "Add to PATH" 即可。

---

## 3. 目录结构说明

```
openClaw learning\
├── openclaw\                         ← OpenClaw 完整项目（含所有依赖）
│   ├── openclaw.mjs                  ← CLI 主入口
│   ├── dist\                         ← 构建产物
│   ├── node_modules\                 ← 依赖包（已预装）
│   └── ...
├── run_openclaw.bat                  ← CMD 启动脚本
├── run_openclaw.ps1                  ← PowerShell 启动脚本（推荐）
├── OpenClaw_Windows安装指南.md        ← 本文档
└── 打包与部署说明.md                  ← 打包说明
```

---

## 4. 启动与使用

### 方式 1：PowerShell（推荐）

```powershell
# 查看版本
.\run_openclaw.ps1 --version

# 健康检查
.\run_openclaw.ps1 doctor

# 启动 Gateway 服务
.\run_openclaw.ps1 gateway run
```

### 方式 2：CMD 批处理

```cmd
run_openclaw.bat --version
run_openclaw.bat gateway run
```

### 方式 3：直接用 Node 调用

```cmd
node openclaw\openclaw.mjs --version
node openclaw\openclaw.mjs gateway run
```

---

## 5. 访问 Control UI（Web 管理界面）

### 5.1 启动 Gateway

```powershell
.\run_openclaw.ps1 gateway run
```

启动后，在浏览器中打开：**http://127.0.0.1:18789**

### 5.2 登录 — 获取 Gateway Token

首次打开会提示 `unauthorized: gateway token missing`，需要 **Gateway Token** 登录。

#### 如何查找 Token

**方法 1：查看配置文件**

```powershell
Get-Content "$env:USERPROFILE\.openclaw\openclaw.json" | Select-String "token" -Context 2
```

在输出中找到 `gateway.auth.token` 的值：

```json
"auth": {
    "mode": "token",
    "token": "你的Token值"
}
```

**方法 2：CLI 获取带 Token 的链接**

```powershell
.\run_openclaw.ps1 dashboard --no-open
```

会输出一个带 Token 的完整 URL，复制到浏览器打开即可。

**方法 3：手动拼接 URL**

```
http://127.0.0.1:18789/chat?session=main&token=你的Token值
```

> [!TIP]
> 修改 Token：编辑 `%USERPROFILE%\.openclaw\openclaw.json` 中的 `gateway.auth.token` 字段，重启 Gateway 生效。

---

## 6. 对接公司内部大模型

> [!IMPORTANT]
> OpenClaw 支持通过 **自定义 Provider** 对接任何兼容 OpenAI API 的内部大模型（如 vLLM、TGI、FastChat、LiteLLM 等）。

### 6.1 配置文件位置

```
%USERPROFILE%\.openclaw\openclaw.json
```

编辑方式：

```powershell
# 交互式配置向导
.\run_openclaw.ps1 configure

# 或直接用记事本编辑
notepad $env:USERPROFILE\.openclaw\openclaw.json
```

### 6.2 对接 OpenAI 兼容 API 的内部模型

编辑 `openclaw.json`，添加以下配置：

```json5
{
  env: {
    INTERNAL_LLM_API_KEY: "你的公司内部API密钥"
  },

  agents: {
    defaults: {
      model: {
        primary: "internal-llm/你的模型名称"
      },
      models: {
        "internal-llm/你的模型名称": {
          alias: "公司内部模型"
        }
      }
    }
  },

  models: {
    mode: "merge",
    providers: {
      "internal-llm": {
        baseUrl: "http://你的内部模型地址:端口/v1",
        apiKey: "${INTERNAL_LLM_API_KEY}",
        api: "openai-completions",
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

### 6.3 配置参数说明

| 参数 | 说明 | 示例 |
| ---- | ---- | ---- |
| `baseUrl` | 内部模型 API 端点 | `http://10.0.1.100:8000/v1` |
| `apiKey` | 访问密钥（不需要可设任意值） | `sk-internal-xxx` |
| `api` | API 协议类型 | `openai-completions`（最常用） |
| `id` | 模型标识（需与 API 中模型名一致） | `qwen2.5-72b-instruct` |
| `contextWindow` | 上下文窗口大小 | `128000` |
| `maxTokens` | 最大输出 token 数 | `32000` |

### 6.4 场景示例

#### 场景 A：对接 vLLM 部署的 Qwen 模型

```json5
{
  agents: {
    defaults: {
      model: { primary: "company-vllm/qwen2.5-72b-instruct" },
      models: { "company-vllm/qwen2.5-72b-instruct": { alias: "Qwen2.5-72B" } }
    }
  },
  models: {
    mode: "merge",
    providers: {
      "company-vllm": {
        baseUrl: "http://10.0.1.100:8000/v1",
        apiKey: "token-xxx",
        api: "openai-completions",
        models: [{
          id: "qwen2.5-72b-instruct",
          name: "Qwen2.5 72B Instruct",
          reasoning: false,
          input: ["text"],
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
          contextWindow: 131072,
          maxTokens: 8192
        }]
      }
    }
  }
}
```

#### 场景 B：对接 LiteLLM 代理的多个模型

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
        baseUrl: "http://litellm.company.com:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3", name: "DeepSeek V3", reasoning: true,
            input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000, maxTokens: 32000
          },
          {
            id: "qwen2.5-72b", name: "Qwen2.5 72B", reasoning: false,
            input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072, maxTokens: 8192
          }
        ]
      }
    }
  }
}
```

### 6.5 验证模型连接

```powershell
# 重启 Gateway
.\run_openclaw.ps1 gateway run

# 检查配置
.\run_openclaw.ps1 doctor

# 测试模型
.\run_openclaw.ps1 agent --local --agent main --thinking low -m "你好，请回复OK"
```

### 6.6 环境变量配置 API Key

除写在配置文件中，也可以使用环境变量：

**方式 1：`.env` 文件**（创建 `%USERPROFILE%\.openclaw\.env`）

```ini
INTERNAL_LLM_API_KEY=sk-your-key-here
```

**方式 2：系统环境变量**

```powershell
[System.Environment]::SetEnvironmentVariable("INTERNAL_LLM_API_KEY", "sk-your-key-here", "User")
```

---

## 7. 常用命令速查

> 以下命令均使用 `.\run_openclaw.ps1` 前缀，CMD 用户替换为 `run_openclaw.bat`

```powershell
# === 基本信息 ===
.\run_openclaw.ps1 --version             # 查看版本
.\run_openclaw.ps1 doctor                # 诊断问题
.\run_openclaw.ps1 doctor --fix          # 自动修复
.\run_openclaw.ps1 configure             # 交互式配置

# === Gateway 管理 ===
.\run_openclaw.ps1 gateway run           # 启动 Gateway
.\run_openclaw.ps1 gateway install       # 安装为服务
.\run_openclaw.ps1 gateway status        # 查看状态
.\run_openclaw.ps1 gateway status --json # JSON 格式状态

# === 配置管理 ===
.\run_openclaw.ps1 config get <key>      # 获取配置
.\run_openclaw.ps1 config set <key> <val># 设置配置

# === 模型与智能体 ===
.\run_openclaw.ps1 agent --local --agent main -m "消息"

# === 健康检查 ===
.\run_openclaw.ps1 health                # 健康检查
.\run_openclaw.ps1 status --all          # 全部状态
.\run_openclaw.ps1 logs                  # 查看日志
```

---

## 8. 故障排查

### 8.1 `run_openclaw.ps1` 报错 "Node.js not found"

安装 Node.js 22.16+：https://nodejs.org/

验证：`node -v`

### 8.2 Gateway 无法启动

```powershell
.\run_openclaw.ps1 doctor          # 查看问题
.\run_openclaw.ps1 doctor --fix    # 自动修复
.\run_openclaw.ps1 logs            # 查看日志
```

### 8.3 无法连接内部模型

1. 确认模型地址可达：`curl http://模型地址:端口/v1/models`
2. 确认 API Key 正确
3. 确认 `api` 字段匹配模型 API 类型
4. 检查 VPN 是否连接
5. 查看日志：`.\run_openclaw.ps1 logs`

### 8.4 Control UI 提示 token missing

参考 [第 5.2 节](#52-登录--获取-gateway-token) 获取 Gateway Token。

---

## 9. VPN 环境注意事项

- **内部模型地址**：确保 `baseUrl` 在 VPN 下可达
- **Gateway 端口**：默认 `127.0.0.1:18789`，不受 VPN 影响
- **DNS**：若内部模型用域名，确认 VPN DNS 可解析

---

## 10. 更新 OpenClaw

本安装包为预构建版本。如需更新，需要在有网络的电脑上重新构建：

1. 进入 `openclaw` 目录
2. 运行 `git pull`
3. 运行 `pnpm install`
4. 运行 `pnpm ui:build`
5. 手动构建 A2UI：
   ```powershell
   pnpm -s exec tsc -p "vendor\a2ui\renderers\lit\tsconfig.json"
   pnpm -s dlx rolldown -c "apps\shared\OpenClawKit\Tools\CanvasA2UI\rolldown.config.mjs"
   ```
6. 运行 `pnpm build:docker`
7. 重新打包分发

---

> **相关链接**
> - [OpenClaw 官方文档](https://docs.openclaw.ai)
> - [Windows 平台指南](https://docs.openclaw.ai/platforms/windows)
> - [模型 Provider 目录](https://docs.openclaw.ai/providers)
> - [配置参考](https://docs.openclaw.ai/gateway/configuration-reference)
> - [自定义 Provider](https://docs.openclaw.ai/gateway/configuration-reference#custom-providers-and-base-urls)
