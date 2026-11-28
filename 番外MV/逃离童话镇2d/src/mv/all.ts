import { reg1 } from './shots1';
import { reg2 } from './shots2';
import { reg3 } from './shots3';
import { reg4 } from './shots4';

let done = false;
export function registerAll() {
  if (done) return;
  done = true;
  reg1(); reg2(); reg3(); reg4();
}
