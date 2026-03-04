import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {

  const circuit = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'public/identity/target/identity.json'), 'utf8'));

  return NextResponse.json({circuit});
}