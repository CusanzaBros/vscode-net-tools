import { GenericPacket } from "./genericPacket";

export class TCPPacket extends GenericPacket {
	packet: DataView;
	innerPacket: GenericPacket;

	constructor(packet: DataView) {
		super(packet);
		this.packet = packet;
		switch (this.destPort) {
			default:
				this.innerPacket = new GenericPacket(
					new DataView(packet.buffer, packet.byteOffset + this.dataOffset*4, packet.byteLength - this.dataOffset*4),
				);
		}
	}

	get srcPort() {
		return this.packet.getUint16(0);
	}

	get destPort() {
		return this.packet.getUint16(2);
	}

	get seqNum() {
		return this.packet.getUint32(4);
	}

	get ackNum() {
		return this.packet.getUint32(8);
	}

	get dataOffset() {
		return this.packet.getUint8(12) >> 4;
	}

	get reserved() {
		return (this.packet.getUint16(12) >> 6) & 0x3f;
	}
	
	get urg(): boolean {
		return (this.packet.getUint8(13) & 0x20) !== 0;
	}

	get ack(): boolean {
		return (this.packet.getUint8(13) & 0x10) !== 0;
	}

	get psh(): boolean {
		return (this.packet.getUint8(13) & 0x8) !== 0;
	}

	get rst(): boolean {
		return (this.packet.getUint8(13) & 0x4) !== 0;
	}

	get syn(): boolean {
		return (this.packet.getUint8(13) & 0x2) !== 0;
	}

	get fin(): boolean {
		return (this.packet.getUint8(13) & 0x1) !== 0;
	}

	get getFlags(): string {
		let buffer: string = "";
		if(this.urg) {
			buffer += "URG ";
		}

		if(this.ack) {
			buffer += "ACK ";
		}

		if(this.psh) {
			buffer += "PSH ";
		}

		if(this.rst) {
			buffer += "RST ";
		}

		if(this.syn) {
			buffer += "SYN ";
		}

		if(this.fin) {
			buffer += "FIN ";
		}

		return buffer.trimEnd();
	}

	get window() {
		return this.packet.getUint16(14);
	}

	get checksum() {
		return this.packet.getUint16(16);
	}

	get urgentPointer() {
		return this.packet.getUint16(18);
	}

	get toString() {
		return `TCP ${this.srcPort} > ${this.destPort}, ${this.seqNum}, ${this.ackNum}, ${this.dataOffset}, ${this.getFlags}, ${this.window}, ${this.checksum}, ${this.urgentPointer}${this.innerPacket.packet.byteLength > 0 ? "," : ""} ${this.innerPacket.toString}`;
	}

	get getProperties() {
		const arr: Array<any> = [];
		arr.push(`Transmission Control Protocol`);
		arr.push(`Source Port: ${this.srcPort}`);
		arr.push(`Destination Port: ${this.destPort}`);
		arr.push(`Sequence number: ${this.seqNum}`);
		arr.push(`Acknowledgement number: ${this.ackNum}`);
		arr.push(`Header Length: ${this.dataOffset * 4} bytes (${this.dataOffset})`);
		const flags: Array<any> = [];
		flags.push(`Flags`);
		flags.push(`Urgent: ${this.urg ? "Set (1)" : "Not set (0)"}`);
		flags.push(`Acknowledgement: ${this.ack ? "Set (1)" : "Not set (0)"}`);
		flags.push(`Push: ${this.psh ? "Set (1)" : "Not set (0)"}`);
		flags.push(`Reset: ${this.rst ? "Set (1)" : "Not set (0)"}`);
		flags.push(`Syn: ${this.syn ? "Set (1)" : "Not set (0)"}`);
		flags.push(`Fin: ${this.fin ? "Set (1)" : "Not set (0)"}`);
		arr.push(flags);
		arr.push(`Window: ${this.window}`);
		arr.push(`Checksum: 0x${this.checksum.toString(16)}`);
		arr.push(`Urgent Pointer: ${this.urgentPointer}`);
		// this.options.forEach(item => {
		// 	arr.push(item.toString);
		// });
		return [arr, this.innerPacket.getProperties];
	}
}
