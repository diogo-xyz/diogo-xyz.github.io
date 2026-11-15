---
title: Small Exponent                   # TODO: replace
ctf: picoctf-2025          # id from ctfs.yml
category: crypto           # id from ctf_categories.yml
difficulty: medium         # easy | medium | hard | insane
points: 200
summary: RSA with e = 3 and no padding, broken with a cube root.
tags: [rsa, math]
flag: "picoCTF{another_example_flag}"
---

<!-- TODO: replace this example writeup -->

## Challenge

We get a public key with `e = 3` and a ciphertext of a short message.

## Solution

The message is so short that `m^3` never wraps around the modulus, so the
ciphertext is a plain integer cube.

![Cube root in Sage](cube-root.png)

```python
from gmpy2 import iroot

m, exact = iroot(c, 3)
assert exact
print(bytes.fromhex(hex(m)[2:]))
```
