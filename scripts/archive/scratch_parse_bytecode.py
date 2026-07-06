import marshal

def print_code_info(co, name):
    print(f"=== {name} ===")
    print("co_argcount:", co.co_argcount)
    print("co_varnames:", co.co_varnames)
    print("co_names:", co.co_names)
    print("co_consts:")
    for i, c in enumerate(co.co_consts):
        if type(c).__name__ == 'code':
            print(f"  {i}: <code object {c.co_name}>")
        else:
            print(f"  {i}: {c}")

def search_code(co):
    if co.co_name in ['calculate_transfer', 'compute_transfer', 'compute_complementary_transfer', 'compute_complementary_transfer_for_card']:
        print_code_info(co, co.co_name)
    for c in co.co_consts:
        if type(c).__name__ == 'code':
            search_code(c)

with open("FareSimulator_v3 (1).exe_extracted/main.pyc", "rb") as f:
    f.read(16)
    code_obj = marshal.load(f)

search_code(code_obj)
