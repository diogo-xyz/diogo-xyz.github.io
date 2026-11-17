---
title: Neural Nets
ctf: h4ckon-2026            # id from ctfs.yml
category: ai-ml             # id from ctf_categories.yml (ai-ml, forensics, crypto…)
#difficulty: medium          # easy | medium | hard | insane
points: 200
#summary: It was donne not out off the team
#tags: [tag1, tag2]          # searchable keywords
solved_as: team 
flag: "d4rk{ved-in.was.here.?}"
---

### Description

> There is a lot of bias in this instrument. Maybe gippity knows what to make of it. btw what are trailing zeros? ehh idc. they dont exist for me atleast tehe

### Solution

The challenge provides two PyTorch files: `mlp_weights.pt` and `target.pt`.

#### Inspecting the files

I started by loading both files and dumping the network structure, the parameters of each layer, and the contents of the target tensor:

```python
import torch

pesos = torch.load("mlp_weights.pt", map_location="cpu", weights_only=True)
target = torch.load("target.pt", map_location="cpu", weights_only=True)

print("Estrutura da rede")
for nome, tensor in pesos.items():
    print(f"{nome:<22} {tuple(tensor.shape)}")

print("\nPesos e biases")
for nome, tensor in pesos.items():
    if nome.endswith("weight"):
        camada = nome[:-len(".weight")]
        w = pesos[camada + ".weight"].flatten().tolist()
        b = pesos[camada + ".bias"].flatten().tolist()
        print(f"{camada:<16} w = {w[0]:+.8f}   b = {b[0]:+.8f}")

print("\ntarget.pt")
print("dtype:", target.dtype, " shape:", tuple(target.shape))
for i, v in enumerate(target.flatten().tolist()):
    print(f"{i} {v:.8e}")
```

```
Estrutura da rede
mlp_layers.0.weight    (1, 1)
mlp_layers.0.bias      (1,)
mlp_layers.1.weight    (1, 1)
mlp_layers.1.bias      (1,)
mlp_layers.2.weight    (1, 1)
mlp_layers.2.bias      (1,)
mlp_layers.3.weight    (1, 1)
mlp_layers.3.bias      (1,)
mlp_layers.4.weight    (1, 1)
mlp_layers.4.bias      (1,)
mlp_layers.5.weight    (1, 1)
mlp_layers.5.bias      (1,)
mlp_layers.6.weight    (1, 1)
mlp_layers.6.bias      (1,)
mlp_layers.7.weight    (1, 1)
mlp_layers.7.bias      (1,)
mlp_layers.8.weight    (1, 1)
mlp_layers.8.bias      (1,)
mlp_layers.9.weight    (1, 1)
mlp_layers.9.bias      (1,)
mlp_layers.10.weight   (1, 1)
mlp_layers.10.bias     (1,)
mlp_layers.11.weight   (1, 1)
mlp_layers.11.bias     (1,)
mlp_layers.12.weight   (1, 1)
mlp_layers.12.bias     (1,)
mlp_layers.13.weight   (1, 1)
mlp_layers.13.bias     (1,)
mlp_layers.14.weight   (1, 1)
mlp_layers.14.bias     (1,)
mlp_layers.15.weight   (1, 1)
mlp_layers.15.bias     (1,)
mlp_layers.16.weight   (1, 1)
mlp_layers.16.bias     (1,)
mlp_layers.17.weight   (1, 1)
mlp_layers.17.bias     (1,)
mlp_layers.18.weight   (1, 1)
mlp_layers.18.bias     (1,)
mlp_layers.19.weight   (1, 1)
mlp_layers.19.bias     (1,)
mlp_layers.20.weight   (1, 1)
mlp_layers.20.bias     (1,)
mlp_layers.21.weight   (1, 1)
mlp_layers.21.bias     (1,)
mlp_layers.22.weight   (1, 1)
mlp_layers.22.bias     (1,)
mlp_layers.23.weight   (1, 1)
mlp_layers.23.bias     (1,)
mlp_layers.24.weight   (1, 1)
mlp_layers.24.bias     (1,)
cnn_layers.0.weight    (1, 1, 1, 1)
cnn_layers.0.bias      (1,)
cnn_layers.1.weight    (1, 1, 1, 1)
cnn_layers.1.bias      (1,)
cnn_layers.2.weight    (1, 1, 1, 1)
cnn_layers.2.bias      (1,)
cnn_layers.3.weight    (1, 1, 1, 1)
cnn_layers.3.bias      (1,)
cnn_layers.4.weight    (1, 1, 1, 1)
cnn_layers.4.bias      (1,)
cnn_layers.5.weight    (1, 1, 1, 1)
cnn_layers.5.bias      (1,)
cnn_layers.6.weight    (1, 1, 1, 1)
cnn_layers.6.bias      (1,)

Pesos e biases
mlp_layers.0     w = -0.02517657   b = +0.00067000
mlp_layers.1     w = +0.38615099   b = +0.00019000
mlp_layers.2     w = +0.17650767   b = +0.00081000
mlp_layers.3     w = -0.82972413   b = +0.00074000
mlp_layers.4     w = +0.47348416   b = +0.00090000
mlp_layers.5     w = -0.92341137   b = +0.01079000
mlp_layers.6     w = +0.22314106   b = +0.00012000
mlp_layers.7     w = +0.03839550   b = +0.00259000
mlp_layers.8     w = -0.14542079   b = +0.00013000
mlp_layers.9     w = -0.38537768   b = +0.09776000
mlp_layers.10    w = +0.63351434   b = +0.00013000
mlp_layers.11    w = -1.06413889   b = +0.01456000
mlp_layers.12    w = +0.45711094   b = +0.40790999
mlp_layers.13    w = +1.13701820   b = +0.00092000
mlp_layers.14    w = -0.29704043   b = +0.21788999
mlp_layers.15    w = +0.00066447   b = +0.41508001
mlp_layers.16    w = -0.85254210   b = +0.34948000
mlp_layers.17    w = -0.55502844   b = +0.05508000
mlp_layers.18    w = +0.64601213   b = +0.24504000
mlp_layers.19    w = +0.58121210   b = +0.24684000
mlp_layers.20    w = -0.13315402   b = +0.00170000
mlp_layers.21    w = +0.13197885   b = +0.24895000
mlp_layers.22    w = +0.09397359   b = +0.32824999
mlp_layers.23    w = +0.00837965   b = +0.09157000
mlp_layers.24    w = -0.35744864   b = +0.29369000
cnn_layers.0     w = -0.70970297   b = +0.27204999
cnn_layers.1     w = -0.73257869   b = +0.43220001
cnn_layers.2     w = +0.50864756   b = +0.42254001
cnn_layers.3     w = -0.43425852   b = +0.14889000
cnn_layers.4     w = -0.48297045   b = +0.03406000
cnn_layers.5     w = +0.98733705   b = +0.47806999
cnn_layers.6     w = -0.80734837   b = +0.42023000

target.pt
dtype: torch.float64  shape: (1, 13)
0 4.82523351e-06
1 4.82523348e-06
2 4.82523352e-06
3 4.82523351e-06
4 4.82523352e-06
5 4.82523351e-06
6 4.82523348e-06
7 4.82524949e-06
8 4.82523348e-06
9 4.82524092e-06
10 4.82523348e-06
11 4.82529223e-06
12 4.82523352e-06
```

The model consists of 25 linear layers (`mlp_layers`) and 7 convolutional layers (`cnn_layers`), all of size 1×1. In other words, each layer holds exactly one weight and one bias. The `target.pt` tensor contains 13 values, all extremely close to one another (≈ `4.825e-06`).

#### Spotting the anomaly

The weights look like ordinary, randomly initialised parameters. The biases, however, are suspiciously round and full of zeros, as if they had been chosen by hand. This ties in directly with the two hints in the description: *"There is a lot of bias in this instrument"* and *"btw what are trailing zeros"*.

Looking more closely, almost every bias contains nothing but zeros from the fifth decimal place onwards, or patterns such as `...999` / `...001`, which are simply float32 rounding artefacts. This suggests that every bias encodes a value with at most five "real" decimal places.

#### Recovering the integers

Scaling every bias by 100000 (10⁵) turns them into integers. This is where the "trailing zeros" hint becomes important: a bias such as `0.0009` was originally `0.00090`, so it must map to `90`, not `9`.

```python
import torch
import tiktoken

pesos = torch.load("mlp_weights.pt", map_location="cpu", weights_only=True)
enc = tiktoken.get_encoding("gpt2")

# bias * 100000 -> ID do token
ids = []
for nome, tensor in pesos.items():
    if nome.endswith("bias"):
        ids.append(round(tensor.item() * 100000))

print("IDs:", ids)
```

```
IDs: [67, 19, 81, 74, 90, 1079, 12, 259, 13, 9776, 13, 1456, 40791, 92, 21789, 41508, 34948, 5508, 24504, 24684, 170, 24895, 32825, 9157, 29369, 27205, 43220, 42254, 14889, 3406, 47807, 42023]
```

Several of these values exceed 127 (`1079`, `9776`, `40791`), which rules out a plain ASCII encoding. The final piece of the puzzle comes from the description: *"Maybe gippity knows what to make of it"*.

![](pasted-image-20261116163759.png)

#### Decoding the tokens

"Gippity" is slang for GPT. GPT models do not read raw characters; they read tokens, each of which is represented by an integer ID. These integers are therefore token IDs from the GPT-2 tokenizer.

I wrote a short script using `tiktoken` to map each ID back to the text it represents:

```python
import torch
import tiktoken

pesos = torch.load("mlp_weights.pt", map_location="cpu", weights_only=True)
enc = tiktoken.get_encoding("gpt2")

# bias * 100000 -> ID do token
ids = []
for nome, tensor in pesos.items():
    if nome.endswith("bias"):
        ids.append(round(tensor.item() * 100000))

for i in ids:
    print(f"{i:<6} {enc.decode_single_token_bytes(i)}")

texto = enc.decode(ids)
flag = texto[:texto.find("}") + 1]
print("\nFlag:", flag)
```

```
67     b'd'
19     b'4'
81     b'r'
74     b'k'
90     b'{'
1079   b'ved'
12     b'-'
259    b'in'
13     b'.'
9776   b'was'
13     b'.'
1456   b'here'
40791  b'.?'
92     b'}'
21789  b' Skyrim'
41508  b'Wars'
34948  b'charges'
5508   b' honest'
24504  b' wandering'
24684  b' conceded'
170    b'\xee'
24895  b' statutes'
32825  b' Ghana'
9157   b' proven'
29369  b' CU'
27205  b'testers'
43220  b'cour'
42254  b' haha'
14889  b' suprem'
3406   b' Your'
47807  b' darts'
42023  b' sleepy'

Flag: d4rk{ved-in.was.here.?}
```

The first 14 tokens form the flag. The remaining tokens after the closing `}` are only padding, used to fill all 32 layers of the network, and decode to meaningless words.

