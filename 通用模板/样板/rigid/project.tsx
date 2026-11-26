// Integration fixture: REAL template actor, no standalone video/sample player.
import {defineProject,type CueFile} from '@tpl/project';
import {cam,type ShotDef} from '@tpl/core';
import '@tpl/tachie-assets';
import {preloadTachie} from '@tpl/tachie';
import type {Emotion} from '@tpl/rigid-character';
import cues from './cues.json';
const emotions:Emotion[]=['happy','angry','sad','joy'];
const shots:ShotDef[]=[{id:'R1',look:'day',title:'骨架与表情',note:'无音源的模板回归工程，不导出视频',cast:[],build:k=>{
 const actor=k.tachie('whale_cutout');
 return f=>{
  // Expression changes belong to cue events, not hardcoded shot percentages.
  const emotion=emotions[Math.max(0,Math.min(emotions.length-1,f.said))];
  actor.expression(emotion).actFrame('walk',f);
  actor.at(-.8+actor.travelX(),0,0);
  return cam([0,1,5.4],[0,.9,0],32);
 };
}}];
export default defineProject({id:'rigid-template-check',kind:'day',title:'角色骨架检查',cues:cues as CueFile,shots,
 planShots:[{id:'R1'}],planOptions:{tail:0,beat:'none'},preloads:[()=>preloadTachie('whale_cutout')]});
