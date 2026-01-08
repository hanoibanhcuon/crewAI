# -*- coding: utf-8 -*-
"""
Test Configuration Script for CrewAI
====================================
Script kiểm tra cấu hình API keys và kết nối với các LLM providers.

Tạo bởi: Claude
Ngày: 2026-01-08
"""

import os
import sys

# =============================================================================
# PHẦN 1: LOAD BIẾN MÔI TRƯỜNG
# =============================================================================

def load_environment():
    """Load biến môi trường từ file .env"""
    try:
        from dotenv import load_dotenv
        
        # Tìm và load file .env
        env_path = os.path.join(os.path.dirname(__file__), '.env')
        if os.path.exists(env_path):
            load_dotenv(env_path)
            print(f"✅ Đã load file .env từ: {env_path}")
            return True
        else:
            print(f"⚠️  Không tìm thấy file .env tại: {env_path}")
            return False
            
    except ImportError:
        print("❌ Chưa cài đặt python-dotenv")
        print("   Chạy: pip install python-dotenv")
        return False


# =============================================================================
# PHẦN 2: KIỂM TRA API KEYS
# =============================================================================

def check_api_keys():
    """Kiểm tra các API keys đã được cấu hình"""
    
    print("\n" + "="*60)
    print("KIỂM TRA CẤU HÌNH API KEYS")
    print("="*60)
    
    # Danh sách các API keys cần kiểm tra
    api_keys = {
        "ANTHROPIC_API_KEY": {
            "required": True,
            "prefix": "sk-ant-",
            "description": "Claude API (Anthropic)"
        },
        "OPENAI_API_KEY": {
            "required": False,
            "prefix": "sk-",
            "description": "OpenAI GPT API"
        },
        "GEMINI_API_KEY": {
            "required": False,
            "prefix": "",
            "description": "Google Gemini API"
        },
        "SERPER_API_KEY": {
            "required": False,
            "prefix": "",
            "description": "Serper Search API"
        }
    }
    
    results = {}
    
    for key_name, config in api_keys.items():
        value = os.getenv(key_name, "")
        
        # Kiểm tra trạng thái
        if not value:
            status = "❌ Chưa cấu hình"
            valid = False
        elif value.startswith("fake"):
            status = "⚠️  Đang dùng key giả"
            valid = False
        elif config["prefix"] and not value.startswith(config["prefix"]):
            status = "⚠️  Định dạng key không đúng"
            valid = False
        else:
            status = "✅ Đã cấu hình"
            valid = True
        
        # Hiển thị kết quả
        required_text = "(BẮT BUỘC)" if config["required"] else "(Tùy chọn)"
        print(f"\n{key_name} {required_text}")
        print(f"   Mô tả: {config['description']}")
        print(f"   Trạng thái: {status}")
        
        if valid and value:
            # Che bớt key để bảo mật
            masked_key = value[:15] + "..." + value[-4:] if len(value) > 20 else value[:10] + "..."
            print(f"   Key: {masked_key}")
        
        results[key_name] = valid
    
    return results


# =============================================================================
# PHẦN 3: KIỂM TRA KẾT NỐI ANTHROPIC
# =============================================================================

def test_anthropic_connection():
    """Test kết nối với Anthropic API"""
    
    print("\n" + "="*60)
    print("TEST KẾT NỐI ANTHROPIC API")
    print("="*60)
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    
    if not api_key or api_key.startswith("fake"):
        print("\n❌ Không thể test - API key chưa được cấu hình đúng")
        return False
    
    try:
        from anthropic import Anthropic
        
        print("\n🔄 Đang kết nối với Anthropic API...")
        
        # Tạo client
        client = Anthropic(api_key=api_key)
        
        # Gửi request test
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=100,
            messages=[
                {"role": "user", "content": "Xin chào! Trả lời ngắn gọn trong 1 câu."}
            ]
        )
        
        # Kiểm tra response
        if response.content:
            print("✅ Kết nối thành công!")
            print(f"\n📝 Response từ Claude:")
            print(f"   {response.content[0].text}")
            
            # Hiển thị usage
            if response.usage:
                print(f"\n📊 Token usage:")
                print(f"   Input: {response.usage.input_tokens}")
                print(f"   Output: {response.usage.output_tokens}")
            
            return True
        else:
            print("❌ Không nhận được response")
            return False
            
    except ImportError:
        print("\n❌ Chưa cài đặt thư viện anthropic")
        print("   Chạy: pip install anthropic")
        return False
        
    except Exception as e:
        print(f"\n❌ Lỗi kết nối: {str(e)}")
        return False


# =============================================================================
# PHẦN 4: KIỂM TRA CREWAI
# =============================================================================

def test_crewai_setup():
    """Kiểm tra cài đặt CrewAI"""
    
    print("\n" + "="*60)
    print("KIỂM TRA CÀI ĐẶT CREWAI")
    print("="*60)
    
    try:
        import crewai
        print(f"\n✅ CrewAI đã được cài đặt")
        print(f"   Version: {crewai.__version__ if hasattr(crewai, '__version__') else 'Unknown'}")
        
        # Kiểm tra các module quan trọng
        from crewai import Agent, Task, Crew, LLM
        print("✅ Import Agent, Task, Crew, LLM thành công")
        
        return True
        
    except ImportError as e:
        print(f"\n❌ Lỗi import CrewAI: {str(e)}")
        print("   Chạy: pip install crewai")
        return False
    except Exception as e:
        print(f"\n❌ Lỗi: {str(e)}")
        return False


# =============================================================================
# PHẦN 5: MAIN
# =============================================================================

def main():
    """Hàm chính chạy tất cả các test"""
    
    print("\n" + "="*60)
    print("    CREWAI CONFIGURATION TEST")
    print("    Kiểm tra cấu hình CrewAI với Claude API")
    print("="*60)
    
    # 1. Load environment
    env_loaded = load_environment()
    
    # 2. Kiểm tra API keys
    key_results = check_api_keys()
    
    # 3. Kiểm tra CrewAI
    crewai_ok = test_crewai_setup()
    
    # 4. Test kết nối Anthropic (chỉ khi có key hợp lệ)
    anthropic_ok = False
    if key_results.get("ANTHROPIC_API_KEY"):
        anthropic_ok = test_anthropic_connection()
    
    # ==========================================================================
    # TÓM TẮT KẾT QUẢ
    # ==========================================================================
    
    print("\n" + "="*60)
    print("TÓM TẮT KẾT QUẢ")
    print("="*60)
    
    summary = [
        ("File .env", "✅" if env_loaded else "❌"),
        ("ANTHROPIC_API_KEY", "✅" if key_results.get("ANTHROPIC_API_KEY") else "❌"),
        ("CrewAI Installation", "✅" if crewai_ok else "❌"),
        ("Anthropic Connection", "✅" if anthropic_ok else "❌"),
    ]
    
    for item, status in summary:
        print(f"   {status} {item}")
    
    # Kết luận
    all_ok = env_loaded and key_results.get("ANTHROPIC_API_KEY") and crewai_ok
    
    print("\n" + "-"*60)
    if all_ok and anthropic_ok:
        print("🎉 TẤT CẢ ĐÃ SẴN SÀNG! Bạn có thể bắt đầu sử dụng CrewAI với Claude.")
    elif all_ok:
        print("⚠️  Cấu hình cơ bản OK. Hãy chạy lại sau khi điền API key thật.")
    else:
        print("❌ Cần hoàn thành cấu hình. Xem hướng dẫn trong SETUP_GUIDE.md")
    print("-"*60 + "\n")
    
    return all_ok


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
