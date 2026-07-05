import os
import re

report_path = "/home/yuan/my_project/项目总结/项目研究报告 v0.1.md"

def test_report():
    assert os.path.exists(report_path), f"File {report_path} does not exist"
    
    with open(report_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    print(f"Report character length: {len(content)}")
    # Ensure it is a full, detailed report
    assert len(content) > 15000, f"Report is too short ({len(content)} chars), should be > 15000 chars"
    
    # Check headers
    headers = [
        "摘要",
        "第一章 绪论",
        "第二章 系统总体架构与运行环境沙箱化设计",
        "第三章 通用可视化代码仿真模板生成器实现",
        "第四章 参数动态双向绑定与控制交互引擎实现",
        "第五章 传热数值仿真工作台及热力建模案例研究",
        "第六章 课程作业自动评测与教学管理模块实现",
        "第七章 系统功能测试与案例验证",
        "结论与展望"
    ]
    for h in headers:
        assert h in content, f"Missing header: {h}"
        
    # Check forbidden words (case insensitive)
    forbidden = ["jupyterhub", "jupyterlab", "nbgrader", "nativeauthenticator"]
    for word in forbidden:
        matches = re.findall(word, content, re.IGNORECASE)
        assert len(matches) == 0, f"Found forbidden word '{word}' {len(matches)} times: {matches}"
        
    print("All checks passed!")

if __name__ == "__main__":
    try:
        test_report()
    except AssertionError as e:
        print(f"Validation FAILED: {e}")
        exit(1)
