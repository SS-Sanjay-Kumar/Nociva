import type { Medication } from '../../../types'

/**
 * DEMONSTRATION FIXTURE — illustrative medication list with real public
 * SMILES structures (from PubChem) for compounds commonly discussed in
 * CYP2D6/CYP2C19/CYP2C9 pharmacogenomics literature. Used to exercise the
 * Molecular Explorer module end-to-end (via the cross-feature navigation
 * link only).
 */
export const MOCK_MEDICATIONS: Medication[] = [
  {
    id: 'med-paroxetine',
    name: 'Paroxetine',
    rxnormId: '32937',
    smiles: 'Fc1ccc(C2CNCCC2COc2ccc3c(c2)OCO3)cc1',
    drugClass: 'SSRI antidepressant · strong CYP2D6 inhibitor',
  },
  {
    id: 'med-tamoxifen',
    name: 'Tamoxifen',
    rxnormId: '10324',
    smiles: 'CC/C(=C(\\c1ccccc1)/c1ccc(cc1)OCCN(C)C)/c1ccccc1',
    drugClass: 'SERM · CYP2D6 prodrug',
  },
  {
    id: 'med-metoprolol',
    name: 'Metoprolol',
    rxnormId: '6918',
    smiles: 'COCCc1ccc(cc1)OCC(O)CNC(C)C',
    drugClass: 'Beta blocker · CYP2D6 substrate',
  },
  {
    id: 'med-warfarin',
    name: 'Warfarin',
    rxnormId: '11289',
    smiles: 'CC(=O)CC(c1ccccc1)c1c(O)c2ccccc2oc1=O',
    drugClass: 'Anticoagulant · CYP2C9 substrate',
  },
  {
    id: 'med-clopidogrel',
    name: 'Clopidogrel',
    rxnormId: '32968',
    smiles: 'COC(=O)C(c1ccccc1Cl)N1CCc2sccc2C1',
    drugClass: 'Antiplatelet · CYP2C19 prodrug',
  },
  {
    id: 'med-omeprazole',
    name: 'Omeprazole',
    rxnormId: '7646',
    smiles: 'CC1=CN=C(C(=C1OC)C)CS(=O)c1nc2ccc(OC)cc2[nH]1',
    drugClass: 'Proton pump inhibitor · CYP2C19 substrate and inhibitor',
  },
  {
    id: 'med-codeine',
    name: 'Codeine',
    rxnormId: '2670',
    smiles: 'CN1CCC23c4c5ccc(O)c4OC2C(O)C=CC3C1C5',
    drugClass: 'Opioid analgesic · CYP2D6 prodrug',
  },
  {
    id: 'med-fluoxetine',
    name: 'Fluoxetine',
    rxnormId: '4493',
    smiles: 'CNCCC(Oc1ccc(cc1)C(F)(F)F)c1ccccc1',
    drugClass: 'SSRI antidepressant · strong CYP2D6 inhibitor',
  },
  {
    id: 'med-paracetamol',
    name: 'Paracetamol (Acetaminophen)',
    rxnormId: '161',
    smiles: 'CC(=O)Nc1ccc(O)cc1',
    drugClass: 'Analgesic / antipyretic',
  },
]
