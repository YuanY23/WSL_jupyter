import json
import traceback

def generate_output(data: dict):
    """
    统一的结果打印包装器，前后端约定的通信格式
    前端将通过 onIOPub 的 stdout 拦截这两个标识符之间的 JSON 串
    """
    print("\n===THERMAL_OUTPUT_START===")
    print(json.dumps(data, ensure_ascii=False))
    print("===THERMAL_OUTPUT_END===\n")

from ..models import ROUTER

def run_simulation(scenario_id: str, params: dict):
    """
    求解器主入口函数。外部（Jupyter Kernel）通常只调用此函数。
    """
    try:
        # 获取对应场景的求解函数
        solver_func = ROUTER.get(scenario_id)
        if not solver_func:
            raise ValueError(f"未知的仿真场景 ID: {scenario_id}")
        
        # 执行求解
        result = solver_func(params)
        
        # 封装标准格式
        result_data = {
            "status": "success",
            "scenario": scenario_id,
            "msg": "计算成功",
            "indicators": result.get("indicators", {}),
            "chart_data": result.get("chart_data", {})
        }
        
        generate_output(result_data)
    except Exception as e:
        error_data = {
            "status": "error",
            "error_message": str(e),
            "traceback": traceback.format_exc()
        }
        generate_output(error_data)
