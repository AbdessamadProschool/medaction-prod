
import axios from 'axios';
import dns from 'dns/promises';

export class ReconnaissanceModule {
  constructor(config) {
    this.config = config;
    this.findings = [];
    this.axiosInstance = axios.create({
      timeout: 10000,
      validateStatus: () => true,
      headers: { 'User-Agent': 'MedAction-Recon/1.0' }
    });
  }

  async runRecon() {
    console.log('  [01] Testing Reconnaissance...');
    const result = { findings: [] };

    // 1. Check robots.txt
    await this.checkFile('/robots.txt', 'Robots.txt Exposure');
    
    // 2. Check sitemap.xml
    await this.checkFile('/sitemap.xml', 'Sitemap Exposure');
    
    // 3. Check security.txt
    await this.checkFile('/.well-known/security.txt', 'Security.txt Exposure');

    // 4. DNS Info
    try {
        const url = new URL(this.config.target);
        const ips = await dns.resolve4(url.hostname).catch(() => []);
        if(ips.length > 0) {
            console.log(`    DNS: ${url.hostname} -> ${ips.join(', ')}`);
        }
    } catch(e) {}

    return result;
  }

  async checkFile(path, title) {
    try {
      const res = await this.axiosInstance.get(`${this.config.target}${path}`);
      if (res.status === 200) {
        this.findings.push({
            severity: 'INFO',
            category: 'Reconnaissance',
            title: title,
            description: `${path} found.`,
            endpoint: path,
            method: 'GET',
            remediation: 'Verify if this file should be public.',
            cvss: 0
        });
      }
    } catch (e) {}
  }
}
