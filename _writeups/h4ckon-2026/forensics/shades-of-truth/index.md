---
title: Shades of Truth
ctf: h4ckon-2026
category: forensics
points: 100
solved_as: team
flag: d4rk{asc11_l0v3}
---

### Description

> I was never a bright student but i still read between the lines

### Solution

The challenge provides the following image. Even at first glance, faint hidden text can be seen across the middle of it.

![](chall.png)

#### Bit-plane analysis

I loaded the image into the online [StegSolve](https://stegotoolkit.com/steganography/stegsolve) tool:

![](captura-de-ecra-de-2026-11-16-15-44-25.png)

In the **Statistics** tab, the chi-square test on the least significant bits flagged the red, green and blue channels as **SUSPICIOUS** (χ² = 1.00). The alpha channel came back OK, but only because the image is RGB and has no alpha channel at all.

The test only indicates that the low-order bits behave abnormally, so I moved on to the **Bit planes** tab. There, the R0, R1, G0 and G1 planes clearly stood out from the rest: almost entirely black, with a single line of text running across the middle.

![](captura-de-ecra-de-2026-11-16-15-48-07.png)

I exported each of these four planes:

**Green 0**
![](green0-plane.png)

**Green 1**
![](green1-plane.png)

**Red 0**
![](red0-plane.png)

**Red 1**
![](red1-plane.png)

#### Combining the planes

Using the site's **Combine** tab, I merged the two planes of each channel with a bitwise OR:

**Combined Green**
![](combineg.png)

**Combined Red**
![](combiner.png)

Combining these two results with a final OR operation revealed the complete hidden text, an encrypted flag: `g4un{dvf11_o0y3}`.

![](flag.png)

#### Decryption

Comparing the prefix `g4un` with the expected flag format `d4rk` shows that every letter has been shifted three positions forward, which points to a Caesar cipher. I used Cryptii to decrypt it:

![](pasted-image-20261116155847.png)


