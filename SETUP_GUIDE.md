# Hướng dẫn Cấu hình CrewAI với Claude API

## 📋 Mục lục
1. [Cấu hình nhanh](#cấu-hình-nhanh)
2. [Lấy API Key](#lấy-api-key)
3. [Kiểm tra cấu hình](#kiểm-tra-cấu-hình)
4. [Sử dụng trong code](#sử-dụng-trong-code)
5. [Xử lý lỗi thường gặp](#xử-lý-lỗi-thường-gặp)

---

## 🚀 Cấu hình nhanh

### Bước 1: Mở file `.env`
File `.env` đã được tạo tại `D:\CrewAI\.env`

### Bước 2: Thêm API Key
Mở file và điền API key của bạn vào dòng:
```
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx-your-key-here
```

### Bước 3: Lưu file và sử dụng

---

## 🔑 Lấy API Key

### Anthropic Claude (Khuyến nghị)
1. Truy cập: https://console.anthropic.com/
2. Đăng nhập hoặc tạo tài khoản
3. Vào **Settings** → **API Keys**
4. Nhấn **Create Key**
5. Copy key (bắt đầu bằng `sk-ant-api03-...`)

### OpenAI (Tùy chọn)
1. Truy cập: https://platform.openai.com/api-keys
2. Nhấn **Create new secret key**
3. Copy key (bắt đầu bằng `sk-...`)

---

## ✅ Kiểm tra cấu hình

Chạy script Python sau để kiểm tra:

```python
# test_config.py
import os
from dotenv import load_dotenv

# Load biến môi trường từ .env
load_dotenv()

# Kiểm tra API keys
api_key = os.getenv("ANTHROPIC_API_KEY")

if api_key and not api_key.startswith("fake"):
    print("✅ ANTHROPIC_API_KEY đã được cấu hình")
    print(f"   Key: {api_key[:20]}...")
else:
    print("❌ ANTHROPIC_API_KEY chưa được cấu hình hoặc là key giả")
    print("   Vui lòng cập nhật file .env")
```

---

## 💻 Sử dụng trong code

### Cách 1: Sử dụng với CrewAI Agent

```python
from crewai import Agent, Task, Crew, LLM
from dotenv import load_dotenv

# Load biến môi trường
load_dotenv()

# Tạo LLM instance với Claude
claude_llm = LLM(
    model="anthropic/claude-3-5-sonnet-20241022",
    temperature=0.7
)

# Tạo Agent
researcher = Agent(
    role="Nhà nghiên cứu",
    goal="Nghiên cứu và phân tích thông tin",
    backstory="Bạn là chuyên gia nghiên cứu với kinh nghiệm 10 năm",
    llm=claude_llm,
    verbose=True
)

# Tạo Task
research_task = Task(
    description="Nghiên cứu về xu hướng AI năm 2025",
    expected_output="Báo cáo chi tiết về xu hướng AI",
    agent=researcher
)

# Tạo và chạy Crew
crew = Crew(
    agents=[researcher],
    tasks=[research_task],
    verbose=True
)

result = crew.kickoff()
print(result)
```

### Cách 2: Sử dụng trực tiếp Anthropic Provider

```python
from crewai.llms.providers.anthropic import AnthropicCompletion
from dotenv import load_dotenv

load_dotenv()

# Khởi tạo Claude completion
claude = AnthropicCompletion(
    model="claude-3-5-sonnet-20241022",
    max_tokens=4096,
    temperature=0.7
)

# Gọi API
response = claude.call(
    messages=[
        {"role": "user", "content": "Xin chào! Bạn có thể giúp gì cho tôi?"}
    ]
)

print(response)
```

---

## ⚠️ Xử lý lỗi thường gặp

### Lỗi: "ANTHROPIC_API_KEY is required"
**Nguyên nhân:** Chưa cấu hình API key
**Giải pháp:**
1. Kiểm tra file `.env` đã có API key chưa
2. Đảm bảo đã gọi `load_dotenv()` trong code
3. Hoặc set biến môi trường Windows:
   ```cmd
   setx ANTHROPIC_API_KEY "your-api-key"
   ```

### Lỗi: "Invalid API key"
**Nguyên nhân:** API key sai hoặc hết hạn
**Giải pháp:**
1. Kiểm tra lại key trên console.anthropic.com
2. Tạo key mới nếu cần

### Lỗi: "Rate limit exceeded"
**Nguyên nhân:** Vượt quá giới hạn request
**Giải pháp:**
1. Chờ một lúc rồi thử lại
2. Nâng cấp plan nếu cần sử dụng nhiều

---

## 📁 Cấu trúc file

```
D:\CrewAI\
├── .env                    # ← File cấu hình (đã tạo)
├── .env.test               # File test (keys giả)
├── SETUP_GUIDE.md          # ← File hướng dẫn này
├── lib/
│   └── crewai/
│       └── src/
│           └── crewai/
│               └── llms/
│                   └── providers/
│                       └── anthropic/  # Claude integration
└── ...
```

---

## 📞 Hỗ trợ

- **CrewAI Docs:** https://docs.crewai.com/
- **Anthropic Docs:** https://docs.anthropic.com/
- **GitHub Issues:** https://github.com/crewAIInc/crewAI/issues

---
*Tạo bởi Claude - Ngày 2026-01-08*
