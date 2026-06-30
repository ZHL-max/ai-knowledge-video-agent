import { Composition } from "remotion";
import type { RenderManifest } from "@aivideo/core";
import { KnowledgeVideo } from "./Video";
import { defaultManifest } from "./default-manifest";

export type KnowledgeVideoProps = {
  manifest: RenderManifest;
};

export const RemotionRoot = () => {
  return (
    <Composition
      id="KnowledgeVideo"
      component={KnowledgeVideo}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={360}
      defaultProps={{ manifest: defaultManifest }}
      calculateMetadata={({ props }) => ({
        durationInFrames: Math.ceil(props.manifest.durationSeconds * 30)
      })}
    />
  );
};
