import React, { useEffect, useRef, useState } from 'react';
import { Image, Platform, Text, View } from 'react-native';
import { Button, color, Field, Heading } from './UI';
import * as api from './hiringApi';

export default function SignatureSettings({ userId }: { userId: string }) {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [preview, setPreview] = useState<string | null>(null), [legalName,setLegalName]=useState(''),[message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { api.profileSignature(userId).then(item => { setPreview(item?.url || null); setLegalName(item?.legalName || ''); }).catch(error => setMessage(error.message)); }, [userId]);
  if (Platform.OS !== 'web') return <View style={{ marginTop: 20 }}><Heading size={20}>Signature asset</Heading><Text style={{ color: color.muted }}>Signature drawing and upload are available in the web app. Signing an agreement requires a separate contract-specific action.</Text></View>;
  const point = (event: React.PointerEvent<HTMLCanvasElement>) => { const r = event.currentTarget.getBoundingClientRect(); return { x: (event.clientX-r.left)*event.currentTarget.width/r.width, y: (event.clientY-r.top)*event.currentTarget.height/r.height }; };
  const down = (event: React.PointerEvent<HTMLCanvasElement>) => { const p=point(event), ctx=canvas.current?.getContext('2d'); if (!ctx) return; drawing.current=true; ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineWidth=3; ctx.lineCap='round'; ctx.strokeStyle='#211546'; event.currentTarget.setPointerCapture(event.pointerId); };
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => { if (!drawing.current) return; const p=point(event), ctx=canvas.current?.getContext('2d'); if (!ctx) return; ctx.lineTo(p.x,p.y); ctx.stroke(); };
  const pick = () => { const input=document.createElement('input'); input.type='file'; input.accept='image/png,image/jpeg'; input.onchange=async () => { const file=input.files?.[0]; if (!file) return; if (!['image/png','image/jpeg'].includes(file.type) || file.size>1024*1024) { setMessage('Use a PNG or JPEG under 1 MB.'); return; }
    const img=new window.Image(); img.onload=() => { const c=canvas.current; if (!c) return; const ctx=c.getContext('2d')!; ctx.clearRect(0,0,c.width,c.height); const scale=Math.min(c.width/img.width,c.height/img.height); const w=img.width*scale,h=img.height*scale; ctx.drawImage(img,(c.width-w)/2,(c.height-h)/2,w,h); const pixels=ctx.getImageData(0,0,c.width,c.height); for(let i=0;i<pixels.data.length;i+=4) { if (pixels.data[i]>245 && pixels.data[i+1]>245 && pixels.data[i+2]>245) pixels.data[i+3]=0; } ctx.putImageData(pixels,0,0); URL.revokeObjectURL(img.src); };
    img.src=URL.createObjectURL(file); }; input.click(); };
  const save = () => { const c=canvas.current; if (!c) return; setBusy(true); c.toBlob(async blob => { try { if (!blob) throw new Error('Could not create PNG.'); await api.saveProfileSignature(userId,legalName,blob); const item=await api.profileSignature(userId); setPreview(item?.url || null); setMessage('Visual signature asset saved privately. No agreement was signed.'); } catch(error) { setMessage((error as Error).message); } finally { setBusy(false); } },'image/png'); };
  return <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, borderRadius: 20, padding: 19, marginTop: 16 }}><Heading size={20}>Your visual signature</Heading><Text style={{ color: color.muted, fontFamily: 'Nunito', marginTop: 5 }}>Draw with mouse, touch or stylus, or upload an image. Saving it never signs a contract.</Text>
    <Text style={{ color:color.ink,fontFamily:'Nunito',fontWeight:'900',marginTop:12,marginBottom:5 }}>Full legal name associated with this image</Text><Field value={legalName} onChangeText={setLegalName} placeholder="Your full legal name" />
    <canvas ref={canvas} width={500} height={150} onPointerDown={down} onPointerMove={move} onPointerUp={() => { drawing.current=false; }} onPointerCancel={() => { drawing.current=false; }} style={{ width: '100%', maxWidth: 500, height: 150, border: '1px solid #e9e4ee', borderRadius: 12, background: '#fff', marginTop: 14, touchAction: 'none' }} />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}><Button outline onPress={pick}>Upload PNG/JPEG</Button><Button outline onPress={() => canvas.current?.getContext('2d')?.clearRect(0,0,500,150)}>Clear drawing</Button><Button disabled={busy} onPress={save}>Save private PNG</Button>{preview && <Button outline onPress={async () => { try { await api.removeProfileSignature(userId); setPreview(null); setMessage('Profile signature removed.'); } catch(error) { setMessage((error as Error).message); } }}>Remove saved image</Button>}</View>
    {preview && <View style={{ marginTop: 15 }}><Text style={{ fontFamily: 'Nunito', color: color.muted }}>Saved preview</Text><Image source={{ uri: preview }} resizeMode="contain" style={{ width: 250, height: 90 }} /></View>}
    {!!message && <Text style={{ color: color.coral, fontFamily: 'Nunito', marginTop: 9 }}>{message}</Text>}
  </View>;
}
