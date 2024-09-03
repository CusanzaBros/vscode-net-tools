import { GenericPacket } from "./genericPacket";

export class ARPPacket extends GenericPacket {
	packet: DataView;

	constructor(packet: DataView) {
		super(packet);
		this.packet = packet;
	}

	get htype() {
		return this.packet.getUint16(0);
	}

	get htypeString() {
		switch (this.htype) {
			case 1:
				return "Ethernet";
			case 2:
				return "Experimental Ethernet";
			case 3:
				return "Amateur Radio AX.25";
			case 4:
				return "Proteon ProNET Token Ring";
			case 5:
				return "Chaos";
			case 6:
				return "IEEE 802 Networks";
			case 7:
				return "ARCNET";
			case 8:
				return "Hyperchannel";
			case 9:
				return "Lanstar";
			case 10:
				return "Autonet Short Address";
			case 11:
				return "LocalTalk";
			case 12:
				return "LocalNet";
			case 13:
				return "Ultra link";
			case 14:
				return "SMDS";
			case 15:
				return "Frame Relay";
			case 16:
				return "Asynchronous Transmission Mode";
			case 17:
				return "HDLC";
			case 18:
				return "Fibre Channel";
			case 19:
				return "Asynchronous Transmission Mode";
			case 20:
				return "Serial Line";
			case 21:
				return "Asynchronous Transmission Mode";
			default:
				return "Unknown network type";
		}
	}

	get ptype() {
		return this.packet.getUint16(2);
	}

	get hardwareAddressLength() {
		return this.packet.getUint8(4);
	}

	get protocolAddressLength() {
		return this.packet.getUint8(5);
	}

	get opcode() {
		return this.packet.getUint16(6);
	}

	get hardwareAddressSender(): string {
		let ret = "";
		for (let i = 8; i < this.hardwareAddressLength + 8 - 1; i++) {
			ret += this.packet.getUint8(i).toString(16).padStart(2, "0") + ":";
		}
		ret += this.packet
			.getUint8(8 + this.hardwareAddressLength - 1)
			.toString(16)
			.padStart(2, "0");
		return ret;
	}

	get protocolAddressSender(): string {
		let ret = "";
		for (
			let i = 8 + this.hardwareAddressLength;
			i < this.protocolAddressLength + this.hardwareAddressLength + 8 - 1;
			i++
		) {
			ret += this.packet.getUint8(i) + ".";
		}
		ret += this.packet.getUint8(this.protocolAddressLength + 8 + this.hardwareAddressLength - 1);
		return ret;
	}

	get hardwareAddressTarget(): string {
		let ret = "";
		for (
			let i = 8 + this.hardwareAddressLength + this.protocolAddressLength;
			i < this.protocolAddressLength + this.hardwareAddressLength * 2 + 8 - 1;
			i++
		) {
			ret += this.packet.getUint8(i).toString(16).padStart(2, "0") + ":";
		}
		ret += this.packet
			.getUint8(this.protocolAddressLength + 8 + this.hardwareAddressLength * 2 - 1)
			.toString(16)
			.padStart(2, "0");
		return ret;
	}

	get protocolAddressTarget(): string {
		let ret = "";
		for (
			let i = 8 + this.hardwareAddressLength * 2 + this.protocolAddressLength;
			i < this.protocolAddressLength * 2 + this.hardwareAddressLength * 2 + 8 - 1;
			i++
		) {
			ret += this.packet.getUint8(i) + ".";
		}
		ret += this.packet.getUint8(
			this.protocolAddressLength * 2 + 8 + this.hardwareAddressLength * 2 - 1,
		);
		return ret;
	}

	get toString() {
		return `ARP, ${this.opcode === 1 ? `Who has ${this.protocolAddressTarget}? Tell ${this.protocolAddressSender}` : `${this.protocolAddressTarget} is at ${this.hardwareAddressSender}`}`;
	}

	get getProperties(): Array<any> {
		const arr: Array<any> = [];
		arr.push("Address Resolution Protocol");
		arr.push(`Hardware type: ${this.htypeString} (${this.htype})`);
		arr.push(`Protocol type: IPv4 (0x${this.ptype.toString(16)})`);
		arr.push(`Hardware size: ${this.hardwareAddressLength}`);
		arr.push(`Protocol size: ${this.protocolAddressLength}`);
		arr.push(`Opcode: ${this.opcode === 1 ? "request" : "reply"} (${this.opcode})`);
		arr.push(`Sender MAC address: ${this.hardwareAddressSender}`);
		arr.push(`Sender IP address: ${this.protocolAddressSender}`);
		arr.push(`Target MAC address: ${this.hardwareAddressTarget}`);
		arr.push(`Target IP address: ${this.protocolAddressTarget}`);
		return arr;
	}
}


