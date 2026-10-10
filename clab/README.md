# Clab · 通信原理交互实验室

基于 `REQUIREMENTS.md` 的可运行网页原型。W1、W2、W3 共用表达式、对象依赖、计算、视图和记录层，13 个主题各有三组可编辑预设，共 39 个。**纯静态，无服务器、无数据库、无外部依赖。**

## 后续维护位置

完整项目独立放在博客根目录的 **`clab/`**：`D:\code\PersonalBlog\spartan-x125.github.io\clab`。源码、样式、需求、测试和说明都在这个目录。后续以博客里的这个目录为维护位置；`D:\code\Clab` 是本次开发的工作副本。

```text
spartan-x125.github.io/
  clab/                    ← 独立项目与维护源码
    index.html
    style.css
    src/                   ← 计算引擎、Worker、场景与界面
    tests/
    scripts/
    REQUIREMENTS.md
    README.md
    VALIDATION.md
    package.json
  public/clab/             ← 自动同步的发布资源
  src/pages/clab/          ← Astro 静态入口
  docs/clab/               ← 博客构建产物
```

直接修改 `clab/index.html`、`clab/style.css` 和 `clab/src/`。在博客根目录运行 `npm run dev` 或 `npm run build` 时，新增的 `predev` / `prebuild` 钩子会自动同步这些内容到发布资源。生成目录 `public/clab/` 与 `docs/clab/` 会由这条流程更新。

在博客根目录运行 `npm --prefix clab test` 可单独验证实验室计算；在 `clab/` 里运行 `npm run dev` 可独立预览实验室（4173 端口），运行 `npm run build` 可导出单独的 `dist/` 静态包。

## 本地使用

Node.js 20 或以上，无须安装依赖：

```powershell
npm run dev
```

访问 `http://localhost:4173/clab/`。请通过 HTTP 访问，不要双击 HTML：模块与 Web Worker 需要正确的资源地址与 MIME 类型。

```powershell
npm test
npm run build
```

`dist/` 内是完整静态网站，可以放到任意静态站点的 `clab/` 目录。全部资源与 Worker 使用相对路径，不依赖网站根目录。没有 CDN、在线问答、统计埋点或第三方运行时。

## 已接入现有博客

本地博客：`D:\code\PersonalBlog\spartan-x125.github.io`。

- 原型发布文件位于 `public/clab/`，Astro 构建后位于 `docs/clab/`。
- 完整源项目位于博客根目录的 `clab/`；博客启动与构建都会自动同步发布资源。
- 同步时将源 HTML 保存为 `public/clab/app.html`，由 Astro 入口生成 `docs/clab/index.html`，避免静态文件与页面路由重名。
- `src/pages/clab/index.astro` 是薄入口：开发和构建时读取静态 HTML，生产部署不执行服务端代码；也让 Astro 开发预览能访问 `/clab/`。
- 入口为 `/clab/`；通常 `/clab` 会规范化为带尾斜杠的目录地址。
- 博客启动器增加「Clab 通信实验室」，桌面窗口允许打开此路径，并使用实验室标题和较宽窗口。
- 原博客 `astro.config.mjs` 指定输出 `docs`，部署工作流原来上传 `dist`，已改为上传 `docs`。
- 本次没有初始化 Clab 仓库、提交、推送，也没有进行线上部署。

本次开发工作副本的首次接入命令如下；项目独立到博客后，日常维护使用上面的自动同步流程：

```powershell
npm run build
node scripts/integrate-blog.mjs
```

接入脚本复制完整项目到博客 `clab/`，准备静态资源并配置入口与同步钩子，不调用 Git，不访问网络。然后在博客目录执行 `npm run build` 或 `npm run dev -- --host 127.0.0.1 --port 4321`。后续无需从旧开发副本重复覆盖博客源码。

也可以直接预览已构建的博客静态文件，与 GitHub Pages 的方式相同：

```powershell
node scripts/serve.mjs --root D:\code\PersonalBlog\spartan-x125.github.io\docs --port 4321
```

## 计算与数据层

| 文件 | 职责 |
| --- | --- |
| `src/math.js` | 有界词法与 AST 解析、实复数运算、函数约定、FFT、线性卷积、固定种子随机数 |
| `src/engine.js` | 命名对象、类型检查、依赖排序、循环检测、依赖版本缓存、信号运算与统一结果 |
| `src/information.js` | 熵、互信息、容量、Huffman、汉明码、CRC、固定卷积码与 Viterbi、LFSR |
| `src/information-views.js` | 概率与容量图、码字翻转、树、矩阵、格图和逐步状态；保留展开与滚动状态 |
| `src/worker.js` | 独立线程、进度反馈、计算批次编号、冻结场景重算缓存 |
| `src/scenes.js` | 对象与场景模型、39 个预设、工具目录、导入校验、重命名引用 |
| `src/app.js` | 草稿事务、撤销重做、操作队列、场景保存与导入导出、数学键盘 |
| `src/plots.js` | 统一结果绘图、坐标与单位分组、读数、游标、缩放平移、PNG 导出 |

输入通过 AST 计算，只调用已实现的数学函数与信号操作，不执行用户程序，不使用 `eval` / `Function`。48 个对象、单定义 4096 字符、1024 个词法单元、48 层嵌套、256–2048 个内部点数，以及求值次数与计算时长边界限制工作量。单个采样或序列结果最多 4096 点；Shape 最多 512 个符号。

依赖版本没有变化的对象复用缓存；参数修改只重新构造受影响对象。所有视图从同一份计算批次读取数据。普通编辑有效后才替换场景，无效草稿保留原定义。删除上游对象时，下游进入错误状态，曲线移除，可撤销恢复。重命名同时改写依赖引用。

较重计算在 Worker 中进行。新批次会取消旧批次，过时结果不会覆盖新结果。普通事务按顺序执行，连续参数修改合并队列中的旧请求；切换场景使原场景的排队事务失效。输入草稿与已生效状态分开。按用户要求，调参时不显示计算提示、不淡化图像；保留已生效图像，结果完成后直接更新。正常结果不显示耗时、重算计数或保存状态小字。

场景记录包含模型版本、表达式、依赖来源、参数滑块配置、颜色与表示分量、时间与频率范围、内部点数、种子、视图开关与每图对象选择、坐标分组和缩放范围、笔记以及冻结场景的原始定义。刷新恢复 W1/W2/W3 各自的工作台。冻结数据由同一引擎重算，不信任导入的计算结果。

自动保存使用 `localStorage`，命名场景最多保存 20 个，撤销历史每工作台最多 50 次。**本地记录不会跨设备或浏览器同步**，清除浏览器数据会删除记录；请导出 JSON 备份。存储失败时界面明确提示，不宣称已经保存。

## 已实现的体验

- 自由定义标量、实/复时间信号、频率函数、有限序列及 `x[n]`。
- `sin cos exp ln log10 sqrt abs arg conj re im sinc rect u If rc` 与常用希腊字母别名。
- 命名引用、显式函数调用和序列索引、语法与类型错误、循环依赖检测。
- 自定义 `h(t)`、`H(f)`、有限 `h[n]`；零延拓线性卷积、补零 FFT 频域滤波、正逆变换。
- 冲激之和的常量权重与线性时移，按解析加权时移处理，不模拟成大数采样点。
- 教学采样率独立于内部绘图分辨率、有限 sinc 重建、采样频谱副本。
- AM / DSB 表达式、有限 FFT Hilbert SSB 与解析包络、相干混频低通恢复示例。
- 匹配滤波、自定义脉冲成形、总升余弦 RC、眼图。
- BPSK、Gray QPSK、I/Q、载波表示、相位偏差、符号 AWGN 与硬判决。
- 数学键盘：当前光标插入、选中内容包裹、模板占位 Tab 切换，配合实体键盘与中文输入。
- 参数精确输入与滑块、每图显示选择、隐藏不删依赖、颜色与线型、复数分量、复平面轨迹。
- 冻结对比、撤销重做、场景保存恢复、JSON 导入导出、带图例与主要条件的 PNG 导出。
- 图形读数与缩放平移；信号/符号游标的播放、暂停、逐步、重播与速度选择。
- 桌面三栏、中等宽度两栏、小屏三面板切换，触摸控件与独立数学键盘。
- W3：二元熵/互信息、AWGN 与 BSC 容量、概率图、Huffman 树、Hamming(7,4) 及 G/H 矩阵、CRC 模二除法、固定 (7,5)₈ 卷积码/Viterbi 格图、三阶 LFSR 与周期相关、异或扰码。
- 接收码字可点击翻转错误图样；树合并、CRC、寄存器和格图支持逐步及播放。播放使用浏览器帧调度，速度可即时调整；不会在每一步重建结构视图。常驻说明已收起或移除，界面保留公式、数据、单位与错误反馈。

## 数值与教学边界

这是一版原型，不宣称达到需求文档全部首版最终验收条件，也不宣称逐项覆盖最新版北邮 801 考纲。

- **有限数值模型**：不是通用符号计算机代数系统。一般微积分、任意 LaTeX、任意矩阵运算、H(s)/H(z) 与反馈系统未实现。输入要求显式乘号，不猜测多字符变量的隐含乘法。
- **冲激**：支持加权线性时移冲激之和；冲激乘积、非线性冲激自变量、普通函数与冲激混合响应暂不支持。
- **卷积**：普通连续输入及响应均截断至计算窗口，零延拓后用补零 FFT 做线性卷积并乘 Δt；离散卷积不乘 Δt。不同采样率的离散对象不隐式混用。
- **频域 Filter**：输入记录双倍补零，在补零记录上使用周期边界；不是对一般无限长理想核的精确线性卷积。界面明确标注边缘截断与振铃。
- **频谱单位**：连续数值傅里叶变换乘 Δt；采样冲激列有限 DTFT 不乘 Δt，幅度副本以 fs 为周期。二者通过频谱坐标菜单分组，避免用一个纵轴假装归一化一致。未知采样率序列使用 cycles/sample，不能标 Hz。图中是幅度谱，非 PSD。
- **逆变换**：Fourier 对象的逆变换恢复同一有限记录；手工频率函数的逆变换是有限频率范围和周期时间边界 IFFT。手工 h(t) 与 H(f) 不被自动当作变换对。
- **复数**：arg 使用 (−π,π]；ln 与 sqrt 使用主值。可选择实部、虚部、模、相位，并观察复平面轨迹；各分量图例明确标注。
- **采样重建**：有限 sinc 求和存在边缘截断；插值不能消除混叠。内部采样率可见，自定义高频表达式仍需要用户选择足够内部分辨率。
- **成形**：`rc` 是总升余弦响应，不是 RRC 发射或接收滤波器；可移除奇点使用解析极限。有限符号序列不等于无限稳态。
- **噪声与接收**：AWGN 使用理想同步符号模型、单位 Es，Eb=Es/log2(M)，每正交维方差 Eb/(2·10^(EbN0/10))。Noise 的 sigma 是每正交维标准差，是有限带宽采样噪声，不能直接等同 Eb/N0 或理想连续白噪声。
- **观测误码**：显示比特错误次数与样本量，不能把零次观测错误说成理论误码率零。未实现大样本 BER 扫描或置信区间分析。
- **匹配滤波过程**：提供输出、模板、自定义响应与游标读数；没有完整的滑动乘积积分动画。播放栏只移动读数游标，不假装实时物理过程。
- **布局**：已实现响应式面板、视图选择与保存；没有可拖拽调整侧栏宽度、图形连线编辑器或跨场景对象库。
- **W3 边界**：概率向量最多 16 个符号，总和须为 1。Huffman 同权规则固定、零概率符号不编码；唯一有效符号约定码字 0。普通汉明 (7,4) 只保证纠正每码字 1 位错误，双错可能误纠；CRC 为最高次项在前、初始 0、无反射或末尾异或的教学模型，不是通用协议 CRC 工具或纠错器。卷积码固定 (7,5)₈、K=3、两位零尾比特，Viterbi 使用整个短记录硬判决、起止 00，无软判决/穿孔/流式译码。LFSR 固定三阶非零初态反馈 [a,b,c]→[b⊕c,a,b]，周期 7；相关为整个有限块的归一化循环相关。没有任意线性码/反馈多项式、交织、正交码构造或通用互相关工具。

## 部署可行性

当前核心需求可全部在浏览器中计算，所以不需要租用服务器。GitHub Pages 托管静态 HTML/CSS/JavaScript，适合本项目。公开仓库可以使用 GitHub Free 的 Pages；详情见 [GitHub 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)。

如果后续需要账户、云同步、多人共享读写记录或服务端密钥，GitHub Pages 本身不能提供这些服务，需要额外后端或托管服务；仍可保留这个静态前端，不一定需要租一台服务器。

## 正确性与参考

采用约定与来源：

- [DSP Guide：Sinc Function](https://www.dspguide.com/ch11/2.htm)：归一化 sinc、矩形脉冲与频谱关系。
- [DSP Guide：DTFT](https://www.dspguide.com/ch10/6.htm)：离散时间序列与频率表示。
- [DSP Guide：Other Transform Pairs](https://www.dspguide.com/ch11/3.htm)：理想频域低通、时域核与卷积关系。
- [MathWorks：Filtering in Communication Systems](https://www.mathworks.com/help/comm/ug/filtering.html)：成形/匹配滤波与 Eb/N0、采样 SNR 的区分。
- [MathWorks：Modulation with Pulse Shaping and Filtering](https://www.mathworks.com/help/comm/ug/modulation-with-pulse-shaping-and-filtering-examples.html)：调制、成形与 AWGN 模型。
- [MIT 6.441 信息论讲义](https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/pages/lecture-notes/)：熵、互信息与容量约定。
- [MIT 6.02 编码与译码讲义](https://ocw.mit.edu/courses/6-02-introduction-to-eecs-ii-digital-communication-systems-fall-2012/resources/readings/)：线性码、伴随式、CRC、卷积码与 Viterbi。
- [MathWorks：Huffman Coding](https://www.mathworks.com/help/comm/ug/huffman-coding.html)：前缀码与平均码长。

验证记录与剩余验收边界见 `VALIDATION.md`。
