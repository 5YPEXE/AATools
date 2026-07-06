import marshal
import dis
import io

def get_dis_text(co):
    stdout = sys.stdout
    sys.stdout = io.StringIO()
    dis.dis(co)
    text = sys.stdout.getvalue()
    sys.stdout = stdout
    return text

import sys

with open("FareSimulator_v3 (1).exe_extracted/main.pyc", "rb") as f:
    f.read(16)
    code_obj = marshal.load(f)

def search(co):
    if co.co_name == 'compute_complementary_transfer_for_card':
        text = get_dis_text(co)
        lines = text.split('\n')
        # Print lines around STORE_FAST for fare_difference
        for i, line in enumerate(lines):
            if 'fare_difference' in line:
                print("--- Around fare_difference store ---")
                for j in range(max(0, i-20), min(len(lines), i+10)):
                    print(lines[j])
            if 'percent_discount' in line:
                print("--- Around percent_discount store ---")
                for j in range(max(0, i-20), min(len(lines), i+10)):
                    print(lines[j])
    for c in co.co_consts:
        if type(c).__name__ == 'code':
            search(c)

search(code_obj)
