import marshal
import dis
import sys
import io

def get_dis_text(co):
    stdout = sys.stdout
    sys.stdout = io.StringIO()
    dis.dis(co)
    text = sys.stdout.getvalue()
    sys.stdout = stdout
    return text

with open("FareSimulator_v3 (1).exe_extracted/main.pyc", "rb") as f:
    f.read(16)
    code_obj = marshal.load(f)

def search(co):
    if co.co_name == 'compute_complementary_transfer':
        print(f"=== FOUND {co.co_name} ===")
        text = get_dis_text(co)
        lines = text.split('\n')
        for i, line in enumerate(lines):
            # Print lines containing percent_row or percent
            if 'percent_row' in line or 'percent' in line or 'discount_type' in line or 'compute_complementary_transfer_for_card' in line:
                print(f"L{i}: {line}")
    for c in co.co_consts:
        if type(c).__name__ == 'code':
            search(c)

search(code_obj)
