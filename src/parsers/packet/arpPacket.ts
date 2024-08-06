import { GenericPacket } from "./genericPacket";

export class ARPPacket extends GenericPacket {
	packet: DataView;

	constructor(packet: DataView) {
		super(packet);
		this.packet = packet;
	}

	get hardwareAddressSpace() {
		return this.packet.getUint16(0);
	}

	get protocolAddressSpace() {
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
		return `ARP 0x${this.hardwareAddressSpace.toString(16).padStart(4, "0")}, 0x${this.protocolAddressSpace.toString(16).padStart(4, "0")}, 0x${this.opcode.toString(16).padStart(4, "0")}, ${this.hardwareAddressSender} > ${this.hardwareAddressTarget}, ${this.protocolAddressSender} > ${this.protocolAddressTarget}`;
	}
}
