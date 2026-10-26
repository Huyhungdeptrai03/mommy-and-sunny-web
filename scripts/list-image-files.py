"""List archive paths only; no extraction of Docker image content."""
import sys
import tarfile

with tarfile.open(sys.argv[1]) as archive:
    for member in archive:
        print(member.name.encode("ascii", "backslashreplace").decode("ascii"))
