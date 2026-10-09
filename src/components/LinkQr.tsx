import { useEffect, useState } from "react";
import { View } from "react-native";
import { SvgXml } from "react-native-svg";
import QRCode from "qrcode";

/** A real QR code. Phones open the encoded link. */
export function LinkQr({ value, size = 220 }: { value: string; size?: number }) {
  const [xml, setXml] = useState("");
  useEffect(() => {
    let cancel = false;
    void QRCode.toString(value, {
      type: "svg",
      margin: 1,
      color: { dark: "#411516", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).then((svg) => {
      if (!cancel) setXml(svg);
    });
    return () => {
      cancel = true;
    };
  }, [value]);
  if (!xml) return <View style={{ width: size, height: size, backgroundColor: "#fff" }} />;
  return <SvgXml xml={xml} width={size} height={size} />;
}

export function appOrigin() {
  if (typeof window !== "undefined" && window.location?.origin && window.location.origin !== "null") {
    return window.location.origin;
  }
  const host = process.env.EXPO_PUBLIC_EMULATOR_HOST || "127.0.0.1";
  return `http://${host}:43123`;
}
