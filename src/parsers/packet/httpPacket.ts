import { GenericPacket } from "./genericPacket";

export class HTTPPacket extends GenericPacket {
	private _lines:string[] = [];

	constructor(packet: DataView) {
		super(packet);
		const decoder = new TextDecoder('UTF-8');
		const ret = decoder.decode(this.packet);
		this._lines = ret.split(String.fromCharCode(13, 10));
	}

	get isHeader():boolean {
		return this.startLine.length > 0;
	}

	get startLine():string {
		const word = this._lines[0].split(" ")[0];
		if (["HTTP/1.1", "OPTIONS", "GET", "HEAD", "POST", "PUT", "DELETE", "TRACE"].indexOf(word) > -1) {
			return this._lines[0];
		}
		return "";
	}

	get toString() {
		const header = this.startLine;
		if (header.length > 0){
			return header;
		}
		return `HTTP`;
	}

	get getProperties() {
		const arr:Array<any> = [`Hypertext Transfer Protocol`];
		
		if (this.isHeader) {
			const startParts = this.startLine.split(" ");
			let startLine:string[] = [];
			if (startParts[0] === "HTTP/1.1") {
				startLine = [
					this.startLine,
					`Version: ${startParts[0]}`,
					`Status: ${startParts[1]}`,
					`Reason: ${startParts[2]}`
				];
			} else {
				startLine = [
					this.startLine,
					`Method: ${startParts[0]}`,
					`URI: ${startParts[1]}`,
					`Version: ${startParts[2]}`
				];
			}
			arr.push(startLine);

			let skipFirst = true;
			for (const line of this._lines) {
				if (!skipFirst) {
					if (line.length === 0) {
						break;
					} else {
						arr.push(line);
					}			
				} else {
					skipFirst = false;
				}
			}
		}

		return arr;
	}
}

