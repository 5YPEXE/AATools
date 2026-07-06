import marshal
import dis
import sys

def search_and_dis(co):
    if co.co_name == 'compute_transfer_for_card':
        print(f"=== FOUND {co.co_name} ===")
        print("varnames:", co.co_varnames)
        print("names:", co.co_names)
        print("consts:", co.co_consts)
        dis.dis(co)
    for c in co.co_consts:
        if type(c).__name__ == 'code':
            search_and_dis(c)

with open("FareSimulator_v3 (1).exe_extracted/main.pyc", "rb") as f:
    f.read(16)
    code_obj = marshal.load(f)

search_and_dis(code_obj)
