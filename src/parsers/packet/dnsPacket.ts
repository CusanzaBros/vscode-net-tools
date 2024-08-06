import { GenericPacket } from "./genericPacket";

export class DNSPacket extends GenericPacket {
	packet: DataView;
	question: BaseRecord[] = [];
	answer: ResourceRecord[] = [];

	constructor(packet: DataView) {
		super(packet);
		this.packet = packet;
		let recordOffset = 0;
		try{
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
		} catch(e) {
			throw "sadasd";
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
		this.question.forEach(item => {questions += item.toString + " "});
		questions = questions.trimEnd();

		let answers = "";
		this.answer.forEach(item => {answers += item.toString + " "});
		answers = answers.trimEnd();

		return `DNS ${this.id}, ${this.qr}, ${this.opcode}, ${this.aa}, ${this.tc}, ${this.rd}, ${this.ra}, ${this.z}, ${this.rcode}${this.qdCount ? ", " + questions : ""}${this.anCount ? ", " + answers : ""}`;
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
		return `${this.name}, ${this.type}, ${this.class}`;
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
			if(i == this.rdLength - 1) {
				break;
			}
			ret += ".";
		}
		return ret;
	}
	

	get toString() {
		try{
		return `${this.name}, ${this.type}, ${this.class}, ${this.ttl}, ${this.rdLength}, ${this.rdata}`;
		} catch {
			return "";
		}
	}
}
