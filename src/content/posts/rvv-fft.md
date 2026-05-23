---
title: "基于RVV的FFT运算加速"
description: "一点关于自己小项目的记录以及相关的一些学习笔记"
date: "2026-05-17"
tags: ["RVV", "嵌入式Linux", "risc-v", "FFT", "音频处理", "笔记"]
draft: true
---

最近因为比赛的原因在risc-v平台上试着部署了一个FFT进行音频处理，然后用RVV进行了加速，但因为代码全是ai跑的会导致什么都没学会连时间复杂度分析都不好搞，于是边学边写点笔记。

## Intro

快速傅里叶变换时至今日依然在音频处理领域拥有重要地位，其时间复杂度为$O(nlogn)$，可以相对快速的得到音频信号频谱图象和数据，进而便于之后的信号分析和处理。但当需要对相对较大量的数据进行高速度要求的处理时，依然会捉襟见肘。实际上FFT拥有多种改进算法，但因为我菜的一批一个不会。此外，另一种提升性能的思路是在硬件层面上优化运算速度，比如使用向量处理器，也就是SIMD进行优化，比如x86架构的MMX，SSE，AVX指令集，或者RISC-V架构的RVV。本文的主要讨论使用RVV技术在RISC-V平台上进行加速。

## 前置芝士之FFT

鉴于我比较懒，再加上我忘的差不多了，关于傅里叶变换以及DFT相关的芝士不在这里详细介绍，可以去看这个[知乎专栏](https://zhuanlan.zhihu.com/p/407885496)，这个[知乎回答](https://www.zhihu.com/question/20456490/answer/25440654)，或者直接上b站搜个数字信号处理的网课或者找本数字信号处理的教材，能把傅里叶级数，傅里叶变换，DTFT,DFS,DFT,FFT都讲一遍。下文主要写FFT是如何优化DFT的。

我们知道DFT的表达式为$X[k]=\frac{1}{N}\sum_{n=0}^{N-1}x[n]e^{-j\frac{2\pi}{N}kn}$。由于$e^{-j\frac{2\pi}{N}kn}$具有周期性，如果使用DFT计算的话我们只需要计算0-N-1范围的值，也就是0<=k<=N-1，进行N次乘法运算和N-1次加法运算，时间复杂度为$O(N^2)$，显然很高。那么该怎么优化呢？我们注意到DFT运的时间复杂度取决于序列的长度N，于是我们很容易就能想到用分治的方法来将一次DFT拆分为多个小规模的的DFT，然后再拼起来便可以大幅降低我们的复杂度。为了方便我敲latex，我们将$e^{-j\frac{2\pi}{N}kn}$记为$W_{N}^{nk}$。我们发现$W_{N}^{nk}$有如下性质：
$$
(W_{N}^{nk})^*=W_{N}^{-nk}=W_{N}^{(N-n)k}=W_{N}^{(N-k)n}
$$
$$
W_{N}^{nk}=W_{N}^{(N+n)k}=W_{N}^{(N+k)n}
$$
这两个性质一个叫对称性一个叫周期性。



## 前置芝士之RVV

关于RVV，[这位大佬](https://www.cnblogs.com/sureZ-learning/category/2453794.html)的RVV系列非常的清晰明确，推荐大家去看。我这里就按我自己的理解大概掰扯一下，如有错误还烦请指正了，毕竟就是个学习笔记（

在介绍RVV之前，我们需要了解SIMD的概念。SIMD是Single Instructions Mutiple Data的缩写，简单来说就是它执行一次加法能处理多个数据。与之对应的是传统的SISD，Single Instructions Single Data，一次加法一个数据。SIMD和SISD的区别是SIMD可以直接进行向量加法，而SIMD不行。比如我现在有两个向量$A[1,2,3,4]^{T}$和$B[5,6,7,8]^{T}$,我想对这两个向量进行相加。如果是SISD就需要进行$a_{11}+b_{11},a_{12}+b_{12},a_{13}+b_{13},a_{14}+b_{14}$四次加法，然后得到向量$C[6,8,10,12]^{T}$；但在SIMD中，我们可以直接$A+B=C$，直接一次加法得到向量$C$，节省了三次加法运算的时间，因而SIMD非常适合进行大量的简单计算。

RVV，即RISC-V的向量扩展，是为RISC-V架构提供SIMD能力的一个指令集。与其它大部分的SIMD指令集有区别的是，RVV指令集支持动态向量长度——这得益于其可变向量长度寄存器。因此，我们可以直接控制其每次运算时处理的数据元素数量，提高效率的同时增强可移植性。

## 一个实例:使用RVV加速对音频信号的FFT处理



```c++
#include "fft.h"

#include <algorithm>
#include <cmath>
#include <stdexcept>

#if defined(__riscv) && defined(__riscv_vector)
#include <riscv_vector.h>

#if defined(__riscv_v_intrinsic)
#define RVV_VSETVL_E64M1 __riscv_vsetvl_e64m1
#define RVV_VLE64_V_F64M1 __riscv_vle64_v_f64m1
#define RVV_VLSE64_V_F64M1 __riscv_vlse64_v_f64m1
#define RVV_VFMUL_VV_F64M1 __riscv_vfmul_vv_f64m1
#define RVV_VFADD_VV_F64M1 __riscv_vfadd_vv_f64m1
#define RVV_VFSUB_VV_F64M1 __riscv_vfsub_vv_f64m1
#define RVV_VSE64_V_F64M1 __riscv_vse64_v_f64m1
#else
#define RVV_VSETVL_E64M1 vsetvl_e64m1
#define RVV_VLE64_V_F64M1 vle64_v_f64m1
#define RVV_VLSE64_V_F64M1 vlse64_v_f64m1
#define RVV_VFMUL_VV_F64M1 vfmul_vv_f64m1
#define RVV_VFADD_VV_F64M1 vfadd_vv_f64m1
#define RVV_VFSUB_VV_F64M1 vfsub_vv_f64m1
#define RVV_VSE64_V_F64M1 vse64_v_f64m1
#endif
#endif

namespace fft {
namespace {

constexpr double kPi = 3.141592653589793238462643383279502884;

bool IsPowerOfTwo(std::size_t value) {
    return value != 0 && (value & (value - 1)) == 0;
}

void BitReversePermute(std::vector<Complex>& data) {
    const std::size_t n = data.size();
    std::size_t j = 0;
    for (std::size_t i = 1; i < n; ++i) {
        std::size_t bit = n >> 1;
        while ((j & bit) != 0) {
            j ^= bit;
            bit >>= 1;
        }
        j ^= bit;
        if (i < j) {
            std::swap(data[i], data[j]);
        }
    }
}

void BitReversePermute(std::vector<double>& real, std::vector<double>& imag) {
    const std::size_t n = real.size();
    std::size_t j = 0;
    for (std::size_t i = 1; i < n; ++i) {
        std::size_t bit = n >> 1;
        while ((j & bit) != 0) {
            j ^= bit;
            bit >>= 1;
        }
        j ^= bit;
        if (i < j) {
            std::swap(real[i], real[j]);
            std::swap(imag[i], imag[j]);
        }
    }
}

void ScalarFftInPlace(std::vector<Complex>& data) {
    const std::size_t n = data.size();
    if (!IsPowerOfTwo(n)) {
        throw std::invalid_argument("FFT input size must be a power of two");
    }

    BitReversePermute(data);

    for (std::size_t len = 2; len <= n; len <<= 1) {
        const double angle = -2.0 * kPi / static_cast<double>(len);
        const Complex w_len(std::cos(angle), std::sin(angle));

        for (std::size_t i = 0; i < n; i += len) {
            Complex w(1.0, 0.0);
            for (std::size_t j = 0; j < len / 2; ++j) {
                const Complex u = data[i + j];
                const Complex v = data[i + j + len / 2] * w;
                data[i + j] = u + v;
                data[i + j + len / 2] = u - v;
                w *= w_len;
            }
        }
    }
}

#if defined(__riscv) && defined(__riscv_vector)
std::vector<Complex> RvvFft(const std::vector<double>& samples) {
    const std::size_t n = NextPowerOfTwo(samples.size());
    std::vector<double> real(n, 0.0);
    std::vector<double> imag(n, 0.0);
    std::copy(samples.begin(), samples.end(), real.begin());

    BitReversePermute(real, imag);

    std::vector<double> twiddle_real(n / 2);
    std::vector<double> twiddle_imag(n / 2);
    for (std::size_t k = 0; k < n / 2; ++k) {
        const double angle = -2.0 * kPi * static_cast<double>(k) / static_cast<double>(n);
        twiddle_real[k] = std::cos(angle);
        twiddle_imag[k] = std::sin(angle);
    }

    for (std::size_t len = 2; len <= n; len <<= 1) {
        const std::size_t half = len / 2;
        const std::size_t step = n / len;
        const ptrdiff_t twiddle_stride = static_cast<ptrdiff_t>(step * sizeof(double));

        for (std::size_t i = 0; i < n; i += len) {
            for (std::size_t j = 0; j < half;) {
                const std::size_t vl = RVV_VSETVL_E64M1(half - j);

                vfloat64m1_t upper_real = RVV_VLE64_V_F64M1(real.data() + i + j, vl);
                vfloat64m1_t upper_imag = RVV_VLE64_V_F64M1(imag.data() + i + j, vl);
                vfloat64m1_t lower_real = RVV_VLE64_V_F64M1(real.data() + i + j + half, vl);
                vfloat64m1_t lower_imag = RVV_VLE64_V_F64M1(imag.data() + i + j + half, vl);
                vfloat64m1_t wr = RVV_VLSE64_V_F64M1(twiddle_real.data() + j * step, twiddle_stride, vl);
                vfloat64m1_t wi = RVV_VLSE64_V_F64M1(twiddle_imag.data() + j * step, twiddle_stride, vl);

                vfloat64m1_t temp_real = RVV_VFSUB_VV_F64M1(
                    RVV_VFMUL_VV_F64M1(lower_real, wr, vl),
                    RVV_VFMUL_VV_F64M1(lower_imag, wi, vl),
                    vl);
                vfloat64m1_t temp_imag = RVV_VFADD_VV_F64M1(
                    RVV_VFMUL_VV_F64M1(lower_real, wi, vl),
                    RVV_VFMUL_VV_F64M1(lower_imag, wr, vl),
                    vl);

                RVV_VSE64_V_F64M1(real.data() + i + j, RVV_VFADD_VV_F64M1(upper_real, temp_real, vl), vl);
                RVV_VSE64_V_F64M1(imag.data() + i + j, RVV_VFADD_VV_F64M1(upper_imag, temp_imag, vl), vl);
                RVV_VSE64_V_F64M1(real.data() + i + j + half, RVV_VFSUB_VV_F64M1(upper_real, temp_real, vl), vl);
                RVV_VSE64_V_F64M1(imag.data() + i + j + half, RVV_VFSUB_VV_F64M1(upper_imag, temp_imag, vl), vl);

                j += vl;
            }
        }
    }

    std::vector<Complex> spectrum(n);
    for (std::size_t i = 0; i < n; ++i) {
        spectrum[i] = Complex(real[i], imag[i]);
    }
    return spectrum;
}
#endif

}  // namespace

bool IsRiscVTarget() {
#if defined(__riscv)
    return true;
#else
    return false;
#endif
}

std::size_t NextPowerOfTwo(std::size_t value) {
    if (value <= 1) {
        return 1;
    }
    --value;
    for (std::size_t shift = 1; shift < sizeof(std::size_t) * 8; shift <<= 1) {
        value |= value >> shift;
    }
    return value + 1;
}

std::vector<Complex> ComputeFft(const std::vector<double>& samples) {
    if (samples.empty()) {
        throw std::invalid_argument("Cannot compute FFT for empty audio");
    }

#if defined(__riscv) && defined(__riscv_vector)
    return RvvFft(samples);
#else
    std::vector<Complex> data(NextPowerOfTwo(samples.size()), Complex(0.0, 0.0));
    for (std::size_t i = 0; i < samples.size(); ++i) {
        data[i] = Complex(samples[i], 0.0);
    }

    ScalarFftInPlace(data);

    return data;
#endif
}

double MagnitudeAtFrequency(const std::vector<Complex>& spectrum,
                            double sample_rate,
                            double target_frequency,
                            std::size_t* selected_bin,
                            double* selected_frequency) {
    if (spectrum.empty() || sample_rate <= 0.0 || target_frequency < 0.0) {
        throw std::invalid_argument("Invalid spectrum or frequency parameters");
    }

    const std::size_t n = spectrum.size();
    const std::size_t nyquist_bin = n / 2;
    std::size_t bin = static_cast<std::size_t>(
        std::llround(target_frequency * static_cast<double>(n) / sample_rate));
    bin = std::min(bin, nyquist_bin);

    if (selected_bin != nullptr) {
        *selected_bin = bin;
    }
    if (selected_frequency != nullptr) {
        *selected_frequency = static_cast<double>(bin) * sample_rate / static_cast<double>(n);
    }

    return std::abs(spectrum[bin]);
}

}  // namespace fft
```

## 进一步优化
在实际测试中，对于一个采样点数量为5467224的一个音频文件，我在平台上对其进行了8388608点的基2-FFT，实际完成计算，结果生成和频谱图绘制的速度大约是28s。


---
参考资料：

https://zhuanlan.zhihu.com/p/407885496
https://www.zhihu.com/question/20456490/answer/25440654
https://www.cnblogs.com/sureZ-learning/category/2453794.html
https://zhuanlan.zhihu.com/p/1923673207967285839