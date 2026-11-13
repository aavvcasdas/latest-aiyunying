// 命令行出片用的 Remotion 入口。
// 工程原本没有这个文件（zip 的 src/mv/README.md 写明「去掉了只给命令行出片用的 register.tsx」，
// 因为作者是在网页里用 @remotion/player 实时播放）。要出 MP4 就得把它补回来：
// 同一个 makeFilm(project) 组件，注册成 <Composition> 就能交给 tools/render_zip_mv.mjs。
import { Composition, registerRoot, staticFile } from "remotion";
import { makeFilm } from "./engine/Film";
import { project } from "./mv/project";
import { FPS, VH, VW } from "./engine/timeline";

const Film = makeFilm(project);
const TIMELINE = project.plan(project.starts, project.ends);

function Root() {
  return (
    <Composition
      id="Yuai"
      component={Film as React.FC<Record<string, unknown>>}
      durationInFrames={TIMELINE.frames}
      fps={FPS}
      width={VW}
      height={VH}
      defaultProps={{
        starts: project.starts,
        ends: project.ends,
        // 命令行出片时音轨由本合成自己混入：走 staticFile 才打得到 public/ 下的文件
        audioSrc: staticFile("yuai.m4a"),
        audioOffset: 0,
        showLyrics: true,
      }}
    />
  );
}

registerRoot(Root);
