---
title: Coil Toss
ctf: rstcon-ctf-2026
category: forensics
points: 100
solved_as: team
flag: rstcon{fc06_writes_dont_lie}
---

### Description

> We mirrored the link between an HMI and a PLC on a water plant skid for a few minutes. The operator swears they only 'read some gauges,' but a register on the PLC kept getting poked. Figure out what the workstation actually wrote.

### Solution

#### Identifying the protocol

I started by identifying the protocol used for communication between the HMI and the PLC, which turned out to be **Modbus/TCP**.

![](pasted-image-20261116115333.png)

Using the [Protocol Explorer](https://protocol-explorer-alpha.vercel.app/) reference, I learned that Modbus is one of the most widely used protocols in industrial control systems, and that its messages are transmitted with no authentication and no encryption.

Since the description mentions a register being modified, I looked up how write operations work in the same reference and found that writing to a single register uses **function code 6**.

![](pasted-image-20261116120000.png)

#### Isolating the write requests

To display only the write requests sent by the workstation, I applied the Wireshark filter `ip.src == 192.168.95.40 and modbus.func_code == 6` and added the value being written as a column:

![](pasted-image-20261116120754.png){: width="700"}

#### Decoding the values

Finally, I copied the values from the new column and used Cryptii to convert them to ASCII text, which revealed the flag:

![](pasted-image-20261116121305.png)

