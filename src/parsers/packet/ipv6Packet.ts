import { Address6 } from "ip-address";
import { GenericPacket } from "./genericPacket";
import { ICMPPacket } from "./icmpPacket";
import { TCPPacket } from "./tcpPacket";
import { UDPPacket } from "./udpPacket";
import { ICMPv6Packet } from "./icmpv6Packet";

export class IPv6Packet extends GenericPacket {
	packet: DataView;
	innerPacket: GenericPacket;

	constructor(packet: DataView) {
		super(packet);
		this.packet = packet;
		this.innerPacket = IPv6Packet.nextPacket(packet, this.nextHeader, this.payloadLength, 40);
	
	}

	get version() {
		return this.packet.getUint8(0) >> 4;
	}

	get payloadLength() {
		return this.packet.getUint16(4);
	}

	get nextHeader() {
		return this.packet.getUint8(6);
	}

	

	

	get srcAddress() {
		const a = this.packet.buffer.slice(this.packet.byteOffset+8, this.packet.byteOffset+8+16);
		const ua = new Uint8Array(a);
		const na = Array.from(ua);
		return Address6.fromByteArray(na);
	}

	get destAddress() {
		const a = this.packet.buffer.slice(this.packet.byteOffset+8+16, this.packet.byteOffset+8+32);
		const ua = new Uint8Array(a);
		const na = Array.from(ua);
		return Address6.fromByteArray(na);
	}

	static nextPacket(packet: DataView, nextHeader: number, payloadLength: number, headerLength: number): GenericPacket {
		switch (nextHeader) {
			case 0x0:
				return new IPv6HopByHop(
					new DataView(packet.buffer, packet.byteOffset + headerLength, payloadLength),
				);
				break;
			case 0x01:
				return new ICMPPacket(
					new DataView(packet.buffer, packet.byteOffset + headerLength, payloadLength),
				);
				break;
			case 0x06:
				return new TCPPacket(
					new DataView(packet.buffer, packet.byteOffset + headerLength, payloadLength),
				);
				break;
			case 0x11:
				return new UDPPacket(
					new DataView(packet.buffer, packet.byteOffset + headerLength, payloadLength),
				);
				break;
			case 0x3a:
				return new ICMPv6Packet(
					new DataView(packet.buffer, packet.byteOffset + headerLength, payloadLength),
				);
				break;
			default:
				return new GenericPacket(
					new DataView(packet.buffer, packet.byteOffset + headerLength, payloadLength),
				);
			}
	}

	get toString() {
		return `IPv${this.version}, ${this.srcAddress.correctForm()} > ${this.destAddress.correctForm()}, (0x${this.nextHeader.toString(16)}), ${this.innerPacket.toString} `;
	}

	
}

class IPv6HopByHop extends GenericPacket {
	innerPacket: GenericPacket;

	constructor(packet: DataView) {
		super(packet);
		this.packet = packet;
		this.innerPacket = IPv6Packet.nextPacket(packet, this.nextHeader, packet.byteLength-this.headerLength, this.headerLength);
	
	}

	get headerLength() {
		return (this.packet.getUint8(1) + 1)*8;
	}

	get nextHeader() {
		return this.packet.getUint8(0);
	}

	get toString(): string {
		return `(0x${this.nextHeader.toString(16)}), ${this.innerPacket.toString}`;
	}
}

class IPv6Routing extends GenericPacket {
	innerPacket: GenericPacket;

	constructor(packet: DataView) {
		super(packet);
		this.packet = packet;
		this.innerPacket = IPv6Packet.nextPacket(packet, this.nextHeader, packet.byteLength-this.headerLength, this.headerLength);
	
	}

	get headerLength() {
		return (this.packet.getUint8(1) + 1)*8;
	}

	get nextHeader() {
		return this.packet.getUint8(0);
	}

	get toString(): string {
		return `(0x${this.nextHeader.toString(16)}), ${this.innerPacket.toString}`;
	}
}
