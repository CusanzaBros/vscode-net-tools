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

	get options(): TCPOption[] {
		if (this.packet.byteLength <= 20) {
			return [];
		}
		
		const headerLength = (this.packet.getUint8(12) >> 4) * 4;
		if (headerLength <= 20) {
			return [];
		}
		
		let i = this.packet.byteOffset + 20;
		const options: TCPOption[] = [];
		try {
			while (i < headerLength + this.packet.byteOffset) {
				const option = TCPOption.create(new DataView(this.packet.buffer, i, this.packet.buffer.byteLength - i));
				if (option.length > 0) {
					i += option.length;
					options.push(option);
				} else {
					i += 1;
				}
			}
		} catch (e) {

		}
	
		return options;
	}

	get toString() {
		return `TCP ${this.srcPort} > ${this.destPort}${this.innerPacket.packet.byteLength > 0 ? ", " : ""} ${this.innerPacket.toString}`;
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
		if(this.options.length > 0) {
			const optArr: Array<any> = [];
			optArr.push(`Options`);
			this.options.forEach(item => {
				optArr.push(item.toString);
			});
			arr.push(optArr);
		}
		return [arr, this.innerPacket.getProperties];
	}
}

class TCPOption {
    optionData: DataView;
    length: number;
    code: number;

    constructor(dv: DataView, offset: number, length: number, code: number) {
        this.optionData = new DataView(dv.buffer, offset, length);
        this.length = length;
        this.code = code;
    }

    static create(dv: DataView): TCPOption {
        const type = dv.getUint8(0);
        switch (type) {
            case 0: // End of option list
                return new TCPOption(dv, 0, 0, 0);
            case 1:
                return new TCPOptionNOP(dv, 0, 1, 1);
            case 2:
                return new TCPOptionMSS(dv, dv.byteOffset + 2, dv.getUint8(1), 2);
            case 3:
                return new TCPOptionWindowScale(dv, dv.byteOffset + 2, dv.getUint8(1), 3);
            case 4:
                return new TCPOptionSACKPermitted(dv, dv.byteOffset + 2, dv.getUint8(1), 4);
            case 8:
                return new TCPOptionTimestamp(dv, dv.byteOffset + 2, dv.getUint8(1), 8);
            default:
                return new TCPOption(dv, dv.byteOffset + 2, dv.getUint8(1), type);
        }
    }

    get toString(): string {
        return `Option: ${this.code}, Length: ${this.length}`;
    }
}

class TCPOptionNOP extends TCPOption {
    constructor(dv: DataView, offset: number, length: number, code: number) {
        super(dv, offset, length, code);
    }

    get toString(): string {
        return `No-Operation (${this.code})`;
    }
}

class TCPOptionMSS extends TCPOption {
    constructor(dv: DataView, offset: number, length: number, code: number) {
        super(dv, offset, length, code);
    }

    get mss(): number {
        return this.optionData.getUint16(0);
    }

    get toString(): string {
        return `Maximum Segment Size Option (${this.code}) - MSS: ${this.mss}`;
    }
}

class TCPOptionWindowScale extends TCPOption {
    constructor(dv: DataView, offset: number, length: number, code: number) {
        super(dv, offset, length, code);
    }

    get shiftCount(): number {
        return this.optionData.getUint8(0);
    }

    get toString(): string {
        return `Window Scale Option (${this.code}) - Shift Count: ${this.shiftCount}`;
    }
}

class TCPOptionSACKPermitted extends TCPOption {
    constructor(dv: DataView, offset: number, length: number, code: number) {
        super(dv, offset, length, code);
    }

    get isPermitted(): boolean {
        return this.length === 2;
    }

    get toString(): string {
        return `SACK Permitted Option (${this.code}) - Permitted: ${this.isPermitted}`;
    }
}

class TCPOptionTimestamp extends TCPOption {
    constructor(dv: DataView, offset: number, length: number, code: number) {
        super(dv, offset, length, code);
    }

    get timestamp(): number {
        return this.optionData.getUint32(0);
    }

    get echoReply(): number {
        return this.optionData.getUint32(4);
    }

    get toString(): string {
        return `Timestamp Option (${this.code}) - Timestamp Value: ${this.timestamp}, Timestamp Echo Reply: ${this.echoReply}`;
    }
}
