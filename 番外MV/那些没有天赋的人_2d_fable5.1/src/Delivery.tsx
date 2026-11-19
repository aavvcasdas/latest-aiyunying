// 交付区：下载「项目新增包」与 remade.md。
// 新增包里的同名文件是一个空壳（包不能装下它自己）。
import zipUrl from "./assets/delivery.zip?url";
import remade from "../delivery/remade.md?raw";

function saveText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** 压缩包内嵌在页面里；转成 Blob 再下载，比直接点一条很长的 data 链接稳 */
async function saveZip(e: React.MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
  const blob = await (await fetch(zipUrl)).blob();
  const url = URL.createObjectURL(new Blob([blob], { type: "application/zip" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "譬如我_大字版_项目新增包.zip";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default function Delivery() {
  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="brush text-3xl text-[#f3d691]">交付</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#b9ad92]">
            压缩包在仓库根目录解压即可：所有文件落在 <code className="text-[#f3d691]">番外MV/譬如我_sonnet5.5/大字版/</code> 下，不覆盖任何现有文件。图集与音轨不在包里——构建时从仓库根的
            <code className="text-[#f3d691]"> 人物/atlas.png</code> 和 <code className="text-[#f3d691]">譬如我.mp3</code> 自动取。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href={zipUrl} download="譬如我_大字版_项目新增包.zip" onClick={saveZip} className="rounded bg-[#b5352b] px-5 py-3 text-sm font-semibold text-[#f6e9d2] transition hover:bg-[#c9443a]">
            下载项目新增包（zip）
          </a>
          <button onClick={() => saveText("remade.md", remade)} className="rounded border border-[#d9a441] px-5 py-3 text-sm font-semibold text-[#f3d691] transition hover:bg-[#d9a441] hover:text-[#0b1126]">
            下载 remade.md
          </button>
        </div>
      </div>
      <pre className="mt-5 max-h-[34rem] overflow-auto rounded-md bg-[#efe3c8] p-4 text-[13px] leading-relaxed whitespace-pre-wrap text-[#231d18] sm:p-6">{remade}</pre>
    </section>
  );
}
