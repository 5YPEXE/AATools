import marshal
import dis
import sys

try:
    with open("FareSimulator_v3 (1).exe_extracted/main.pyc", "rb") as f:
        header = f.read(16)
        print("Magic:", header[:4].hex())
        code_obj = marshal.load(f)
        
    print("Successfully loaded code object!")
    # Redirect stdout to file
    orig_stdout = sys.stdout
    with open("scratch/disassembled_main.txt", "w", encoding="utf-8") as out:
        sys.stdout = out
        dis.dis(code_obj)
    sys.stdout = orig_stdout
    print("Disassembly saved to scratch/disassembled_main.txt")
except Exception as e:
    print("Failed to load/disassemble:", e)
