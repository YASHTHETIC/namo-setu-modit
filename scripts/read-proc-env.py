"""Read DATABASE_URL-style env vars out of a running process (read-only).

64-bit Windows: OpenProcess -> NtQueryInformationProcess(PEB) ->
ReadProcessMemory PEB.ProcessParameters.Environment (UTF-16 block).
"""
import ctypes
import ctypes.wintypes as wt
import sys

k32 = ctypes.WinDLL("kernel32.dll", use_last_error=True)
nt = ctypes.WinDLL("ntdll.dll")

PROCESS_QUERY_INFORMATION = 0x0400
PROCESS_VM_READ = 0x0010


class PBI(ctypes.Structure):
    _fields_ = [
        ("ExitStatus", ctypes.c_void_p),
        ("PebBaseAddress", ctypes.c_void_p),
        ("AffinityMask", ctypes.c_void_p),
        ("BasePriority", ctypes.c_void_p),
        ("UniqueProcessId", ctypes.c_void_p),
        ("InheritedFromUniqueProcessId", ctypes.c_void_p),
    ]


def read_mem(h, addr, size):
    buf = (ctypes.c_char * size)()
    got = ctypes.c_size_t()
    if not k32.ReadProcessMemory(h, ctypes.c_void_p(addr), buf, size, ctypes.byref(got)):
        raise OSError(ctypes.get_last_error())
    return bytes(buf[: got.value])


def env_of(pid: int) -> list[str]:
    h = k32.OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, False, pid)
    if not h:
        raise OSError("OpenProcess failed")
    try:
        pbi = PBI()
        ret = nt.NtQueryInformationProcess(
            h, 0, ctypes.byref(pbi), ctypes.sizeof(pbi), None
        )
        if ret:
            raise OSError("NtQueryInformationProcess failed")
        params = ctypes.c_size_t()
        ctypes.memmove(
            ctypes.byref(params), read_mem(h, pbi.PebBaseAddress + 0x20, 8), 8
        )
        env_ptr = ctypes.c_size_t()
        env_size = ctypes.c_size_t()
        ctypes.memmove(ctypes.byref(env_ptr), read_mem(h, params.value + 0x80, 8), 8)
        ctypes.memmove(ctypes.byref(env_size), read_mem(h, params.value + 0x3F0, 8), 8)
        size = env_size.value or (64 * 1024)
        raw = read_mem(h, env_ptr.value, size)
        text = raw.decode("utf-16-le", errors="ignore")
        return [s for s in text.split("\x00") if s]
    finally:
        k32.CloseHandle(h)


if __name__ == "__main__":
    pid = int(sys.argv[1])
    needles = ("DATABASE", "DB_", "SQL", "POSTGRES", "REDIS", "ENV", "MODIT")
    for var in env_of(pid):
        if any(n in var.upper() for n in needles):
            print(var)
