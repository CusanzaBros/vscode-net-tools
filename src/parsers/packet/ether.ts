import { ARPPacket } from "./arpPacket";
import { GenericPacket } from "./genericPacket";
import { FileContext } from "../file/FileContext";
import { IPv4Packet } from "./ipv4Packet";
import { IPv6Packet } from "./ipv6Packet";
import { vlanPacket } from "./vlanPacket";
import { pppoedPacket, pppoePacket, pppPacket, pppLinkControlPacket, pppIPControlPacket, pppIPv6ControlPacket } from "./pppoePacket";
import { Node } from "../../packetdetailstree";
import * as vscode from 'vscode';

export class EthernetPacket extends GenericPacket {
	innerPacket: GenericPacket;

	static namePayload(proto:number) {
		switch (proto) {
			case 0x0800: return `IPv4`;
			case 0x0806: return `ARP`;
			case 0x8100: return `802.1Q Virtual LAN`;
			case 0x86dd: return `IPv6`;
			case 0x880b: return `PPP`;
			case 0x8863: return `PPPoE Discovery`;
			case 0x8864: return `PPPoE`;
			default: return `Unknown`;
		}
	}

	static processPayload(proto: number, payload: DataView, fc:FileContext): GenericPacket {
		if (proto <= 0x5DC) {
			const generic =  new GenericPacket(payload, fc);
			generic.registerProtocol(`IEEE802.3`, fc);
			return generic;
		}

		switch (proto) {
			case 0x800:
				if(payload.getUint8(0) >> 4 === 4) {
					return new IPv4Packet(payload, fc);
				} else if(payload.getUint8(0) >> 4 === 6) {
					return new IPv6Packet(payload, fc);
				} else {
					return new GenericPacket(payload, fc);
				}
			case 0x806:
				return new ARPPacket(payload, fc);
			case 0x6558:
				return new EthernetPacket(payload, fc);
			case 0x8100:
				return new vlanPacket(payload, fc);
			case 0x86dd:
				return new IPv6Packet(payload, fc);
			case 0x880b:
				return new pppPacket(payload, fc);
			case 0x8863:
				return new pppoedPacket(payload, fc);
			case 0x8864:
				return new pppoePacket(payload, fc);
			default:
				const generic =  new GenericPacket(payload, fc);
				generic.registerProtocol(`Ethertype #${proto} (0x${proto.toString(16).padStart(4, "0")})`, fc);
				return generic;
		}
	}

	constructor(packet: DataView, fc:FileContext) {
		super(packet, fc);
		fc.headers.push(this);
		this.innerPacket = EthernetPacket.processPayload(this.proto, new DataView(packet.buffer, packet.byteOffset + 14, packet.byteLength - 14), fc);
		this.registerAddress(this.dstMAC, fc);
		this.registerAddress(this.srcMAC, fc);
	}

	get dstMAC() {
		//00:11:22:33:44:55
		let ret = "";
		ret += this.packet.getUint8(0).toString(16).padStart(2, "0") + ":";
		ret += this.packet.getUint8(1).toString(16).padStart(2, "0") + ":";
		ret += this.packet.getUint8(2).toString(16).padStart(2, "0") + ":";
		ret += this.packet.getUint8(3).toString(16).padStart(2, "0") + ":";
		ret += this.packet.getUint8(4).toString(16).padStart(2, "0") + ":";
		ret += this.packet.getUint8(5).toString(16).padStart(2, "0");
		return ret.toUpperCase();
	}

	get srcMAC() {
		let ret = "";
		ret += this.packet.getUint8(6).toString(16).padStart(2, "0") + ":";
		ret += this.packet.getUint8(7).toString(16).padStart(2, "0") + ":";
		ret += this.packet.getUint8(8).toString(16).padStart(2, "0") + ":";
		ret += this.packet.getUint8(9).toString(16).padStart(2, "0") + ":";
		ret += this.packet.getUint8(10).toString(16).padStart(2, "0") + ":";
		ret += this.packet.getUint8(11).toString(16).padStart(2, "0");
		return ret.toUpperCase();
	}

	get proto() {
		return this.packet.getUint16(12);
	}

	get protoName():string {
		return EthernetPacket.namePayload(this.proto);
	}

	get toString() {
		// 00:11:22:33:44:55 > 00:11:22:33:44:55 (0x800)
		if (vscode.workspace.getConfiguration('networktools').get('showHardwareAddresses')) {
			return `${this.srcMAC} > ${this.dstMAC} (0x${this.proto.toString(16).padStart(4, "0")}): ${this.innerPacket.toString}`;
		} else {
			return `(0x${this.proto.toString(16).padStart(4, "0")}): ${this.innerPacket.toString}`;
		}
	}

	get getProperties(): Node[] {
		const elements: Node[] = [];
		let e = new Node("Ethernet II", `Src: ${this.srcMAC}, Dst: ${this.dstMAC}`, vscode.TreeItemCollapsibleState.Collapsed, this.packet.byteOffset, 14);
		e.children.push(new Node("Source Address", this.srcMAC, vscode.TreeItemCollapsibleState.None, this.packet.byteOffset+6, 6));
		e.children.push(new Node("Destination Address", this.dstMAC, vscode.TreeItemCollapsibleState.None, this.packet.byteOffset, 6));
		e.children.push(new Node("Type", `${this.protoName} (0x${this.proto.toString(16)})`, vscode.TreeItemCollapsibleState.None, this.packet.byteOffset + 12, 2));

		elements.push(e);
		return elements.concat(this.innerPacket.getProperties);
	}
}
