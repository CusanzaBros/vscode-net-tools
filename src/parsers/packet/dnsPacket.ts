import { GenericPacket } from "./genericPacket";

export class DNSPacket extends GenericPacket {
	packet: DataView;
	question: BaseRecord[] = [];
	answer: ResourceRecord[] = [];

	constructor(packet: DataView) {
		super(packet);
		this.packet = packet;
		let recordOffset = 0;
		
		for(let i  = 0; i < this.qdCount; i++) {
			this.question.push(new BaseRecord(new DataView(packet.buffer, packet.byteOffset + 12 + recordOffset, packet.byteLength - 12 - recordOffset)));
			recordOffset += this.question[i].length;
		}
		for(let i  = 0; i < this.anCount; i++) {
			if(packet.byteOffset + 12 + recordOffset >= packet.byteLength) {
				break;
			}
			this.answer.push(new ResourceRecord(new DataView(packet.buffer, packet.byteOffset + 12 + recordOffset, packet.byteLength - 12 - recordOffset)));
			recordOffset += this.answer[i].length;
		}
		
	}

	get id() {
		return this.packet.getUint16(0);
	}

    get qr() {
		return this.packet.getUint8(2) >> 7;
	}

    get opcode() {
		return (this.packet.getUint8(2) & 0x78) >> 3;
	}

    get opMessage() {
        switch(this.opcode) {
            case 0: return "Standard query";
            case 1: return "Inverse query";
            case 2: return "Server status request";
            default: return "Unknown query type";

        }
    }

    get aa() {
		return (this.packet.getUint8(2) & 0x4) >> 2;
	}	

    get tc() {
		return (this.packet.getUint8(2) & 0x2) >> 1;
	}	

    get rd() {
		return this.packet.getUint8(2) & 0x1;
	}	

    get ra() {
		return this.packet.getUint8(3) >> 7;
	}	
    
    get z() {
		return (this.packet.getUint8(3) & 0x70) >> 4;
	}	

    get rcode() {
		return this.packet.getUint8(3) & 0xf;
	}	

    get qdCount() {
		return this.packet.getUint16(4);
	}	

    get anCount() {
		return this.packet.getUint16(6);
	}	

    get nsCount() {
		return this.packet.getUint16(8);
	}   	

    get arCount() {
		return this.packet.getUint16(10);
	}	

	get toString() {
		let questions = "";
		this.question.forEach(item => {
            questions += item.name + " ";
        });
		questions = questions.trimEnd();

		let answers = "";
		this.answer.forEach(item => {
            answers += item.name + " ";
        });
		answers = answers.trimEnd();

		return `DNS ${this.opMessage} 0x${this.id.toString(16).padStart(4, `0`)}${this.qdCount ? ", " + questions : ""}${this.anCount ? ", " + answers : ""}`;
	}

	get getProperties() {
		const arr: Array<any> = [];
		arr.push(`Domain Name System`);
		arr.push(`Transaction ID: ${this.id}`);
		const flags = [
			`Flags: 0x${this.opcode.toString(16).padStart(4, "0")} ${this.opMessage}`,
			`Response: ${this.qr ? `Message is a response` : `Message is a query`}`,
			`Authoritative: Server is ${this.aa ? `` : `not `}an authority for domain`,
			`Truncated: Message is ${this.tc ? `` : `not `}truncated`,
			`Recursion desired: Do ${this.aa ? `` : `not `}query recursively`,
			`Recursion available: Server can${this.aa ? `` : `not`} do recursive queries`,
			`Z: Reserved (${this.z})`
		];
		switch(this.rcode) {
			case 0: flags.push(`Reply code: No error (0)`);
			case 1: flags.push(`Reply code: Format error (1)`);
			case 2: flags.push(`Reply code: Server error (2)`);
			case 3: flags.push(`Reply code: Name error (3)`);
			case 4: flags.push(`Reply code: Not implemented (4)`);
			case 5: flags.push(`Reply code: Refused (5)`);
			default: flags.push(`Reply code: Unknown reply code (${this.rcode})`);
		}
		arr.push(flags);
		arr.push(`Questions: ${this.qdCount}`);
		arr.push(`Answer RRs: ${this.anCount}`);
		arr.push(`Authority RRs: ${this.nsCount}`);
		arr.push(`Additional RRs: ${this.arCount}`);
		if(this.qdCount) {
			const qArr: Array<any> = [];
			qArr.push(`Queries`);
			this.question.forEach(item => {
				qArr.push(item.toString);
			});
			arr.push(qArr);
		}
		if(this.anCount) {
			const anArr: Array<any> = [];
			anArr.push(`Answers`);
			this.question.forEach(item => {
				anArr.push(item.toString);
			});
			arr.push(anArr);
		}
		return arr;
	}
}

class BaseRecord {
	packet: DataView;
	name: string = "";
	length: number;



	constructor(packet: DataView) {
		this.packet = packet;
		let count = this.packet.getUint8(0);
		const decoder = new TextDecoder('utf-8');
		let i = 1;
		while(count) {
			this.name += decoder.decode(new DataView(packet.buffer, packet.byteOffset + i, count));
			i += count;
			count = this.packet.getUint8(i++);
			if(!count) {
				break;
			}
			this.name += ".";
		}
		this.length = i+4;
		
	}

	get getName() {
		return this.name;
	}

	get type() {
		return this.packet.getUint16(this.length - 4);
	}

	get class() {
		return this.packet.getUint16(this.length - 2);
	}

	get getLength() {
		return this.length;
	}

	get toString() {
		return `${this.name}: type ${this.type}, class ${this.class}`;
	}
}

class ResourceRecord {
	packet: DataView;
	name: string = "";
	nameLength: number;


	constructor(packet: DataView) {
		this.packet = packet;
		let count = this.packet.getUint8(0);
		const decoder = new TextDecoder('utf-8');
		let i = 1;
		while(count) {
			this.name += decoder.decode(new DataView(packet.buffer, packet.byteOffset + i, count));
			i += count;
			count = this.packet.getUint8(i++);
			if(!count) {
				break;
			}
			this.name += ".";
		}
		this.nameLength = i;
	}

	get getName() {
		return this.name;
	}

	get type() {
		return this.packet.getUint16(this.nameLength);
	}

	get class() {
		return this.packet.getUint16(this.nameLength + 2);
	}

	get ttl() {
		return this.packet.getUint32(this.nameLength + 4);
	}

	get rdLength() {
		return this.packet.getUint16(this.nameLength + 8);
	}	

	get length() {
		return this.nameLength + 10 + this.rdLength;
	}

	get rdata() {
		let ret = "";
		for(let i = 0; i < this.rdLength; i++) {
			ret += this.packet.getUint8(this.nameLength + 10 + i);
			if(i === this.rdLength - 1) {
				break;
			}
			ret += ".";
		}
		return ret;
	}
	

	get toString() {
		return `${this.name}: type ${this.type}, class ${this.class}, time to live: ${this.ttl} seconds, data length${this.rdLength}, ${this.rdata}`;
	}
}
