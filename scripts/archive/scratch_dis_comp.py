import marshal
import dis

def search_and_dis(co):
    if co.co_name == 'compute_complementary_transfer_for_card':
        print(f"=== FOUND {co.co_name} ===")
        # Print lines of disassembly up to instruction 1000
        dis.dis(co, depth=1)
    for c in co.co_consts:
        if type(c).__name__ == 'code':
            search_and_dis(c)

with open("FareSimulator_v3 (1).exe_extracted/main.pyc", "rb") as f:
    f.read(16)
    code_obj = marshal.load(f)

search_and_dis(code_obj)
