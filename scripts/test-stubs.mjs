/** node:test stand-ins for the two native modules the phone store imports. */
export async function resolve(specifier, context, next) {
  if (specifier === "@react-native-async-storage/async-storage") return { url: "data:text/javascript,const m=new Map();export default {getItem:async k=>m.get(k)??null,setItem:async(k,v)=>{m.set(k,v)},removeItem:async k=>{m.delete(k)},multiRemove:async ks=>ks.forEach(k=>m.delete(k))}", shortCircuit: true };
  if (specifier === "react-native") return { url: "data:text/javascript,export const AppState={addEventListener(){return{remove(){}}}};export const Platform={OS:'web'};", shortCircuit: true };
  return next(specifier, context);
}
