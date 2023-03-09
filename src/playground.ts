import { z } from "zod";
import { vonage } from ".";

const key = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCtDAIwgicqMMv+
hox+WoJrcSYwqtkilVnOeWuCsR1CrcyFyjrJiwxOZkRGlzODzwEFZYYfeS/Q9b4o
mtvi9B+96u2S7CyXD74X8fHInxfHOY+uCkXPHDli33iHtTqSS1W1Q4vOobri3x+o
1MDZLwFAElpfjscAS0FYajrMW+J0EtZR7uRZtmEZLtJG4UTF+8A47I1PhTdyeHJn
GboiWiCtEh4R/Ouyqj5WuDHn8WTLQKM3GqnWFMXLm0u4u1Vs08rKGqUQwq++LMjb
N2klFsqSSC365A+IucbV3DIB+j68vKYWS193BcvpcfK+hgS74sueJTiYgUw6JV08
S+VDBYkLAgMBAAECggEAB6r4jd22jpAK+gRMRW0NSmWBI7buWDH2AMgwk2H1wfah
kWwcnsGikfbGH7qjdbu+d9a/0rU0ATZibrot9CiNH4VBcbk1YJw5+CWoaRNjolhS
nYum/D5r7I2qcZj+N21PJvEPSOCxv0vTw09qHDWRAJ3Pk1xoRQMQqjJK2LNZnXsF
i59ZtWtGuRJF1V1hOSdPagYVsDnd/ElqT8taKPXKWot6qn6iX+hYGYbcNXLi5uWn
kH7IFOGWeJCNfLa6Ra/D7DY2p3uzjzEj7SJ4xYzMlf2ms5wZyMww14kuc2qnWgAp
hXwRin15V437czeC8RmDWGQqLt4+x22vaF9mBpgsAQKBgQDXmd1DTE6r9cuSXhbV
hXBVPYLj8RXHwdsLDtsO2BzJ7nHWM0x21VHBcwHs1CtoizK+655nQwqQcX9zNKM4
/PsSKZotaz2t5V2rONWGS8wbnXQmmnwjrdvvE0En8fFITvxDcv++IBFsuX5vQhZU
t5PoA0onFkPPRQlWaEMNNZvTQQKBgQDNeN8WZ/Dc9AyaNhVQWeLRH5mklMcLARB6
/BCoFsMKjL7aCC74Kq6GmQyCDYGL9fSjk5CpNzZXt/2xQ4vb3xgM54rLETZ1QBBt
elNCwjuvame23mVUgMZs8PkDT2ihY+vMoWRmOiB2uNODYWBVsWcuMR0iKsDefB7z
QL7vgIZlSwKBgQCViuqW8EmtKqrN1ic+aPTWmvi7xA/YY1TcYax9qlallZct/Jzv
29x+MphGPY/yToKfPGy9sRmVwLOnI/6G26oGGgcPs8+vW2VSCvTH1rE3Akp7MDIk
yUXAmPlbjIxQHEELQ6uxoyqS4EKbRxqYHlEf35BCdkYIcRkd7ul7MxDnQQKBgHyC
/J01S255rZFdqLjSX3JeddqYFa4DbRs52FYjxPmFpLm3L89O/geugzfkO1a3KxJc
/9KrFJE/e8qJph0NKiPXw/GecqPGuK2+7OmNjmGUV1knl7wHdTbbJ+rrmfoC9QdB
3fdczgNjqTj6L0h+goopVQA5bDrmeFLsL0gvWEHVAoGADxX7J3QQd7Q8wpSjQECR
Z4h+y6YuCBDwNdLsovURLyP0iBv2u8Kgy+dyVlR0yqVLZv/sKg7gfHdhpd9uIc2M
Gun3Y4GGOsx2TFWjsCfiXWboOMQDNxl9g8GHmH6FIK3/0VcMFosaJ363ymTLUsnK
e4jDk8pVTMMqbxzgAypZS74=
-----END PRIVATE KEY-----`;
const test = async () => {
  const wrapper = vonage(
    {
      applicationId: "1799f7a8-f0e7-4603-a359-05b9be1fa1f5",
      privateKey: key,
    },
    { logger: true }
  );

  // const t = await wrapper.auth.createBearerHeader();
  // const t = await wrapper.conversation.create();
  // const t = await wrapper.conversation.createMany([{}, {}]);
  // const t = await wrapper.conversation.deleteMany(undefined, "sure");
  const t = await wrapper.conversation.findMany();

  console.log(t);
};

test();
