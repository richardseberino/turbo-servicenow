class Helper {
	public static readonly CMDB_CI_VMWARE_INSTANCE = 'cmdb_ci_vmware_instance';
	public static readonly CMDB_CI_VCENTER = 'cmdb_ci_vcenter';
	public static readonly CMDB_CI_HYPER_V_INSTANCE = 'cmdb_ci_hyper_v_instance';
	public static readonly CMDB_CI_VIRTUALIZATION_SERVER = 'cmdb_ci_virtualization_server';
	public static readonly CMDB_CI_VM_INSTANCE = 'cmdb_ci_vm_instance';
	public static readonly IP_ADDRESS = 'ip_address';
	public static readonly HOST_NAME = 'host_name';
	public static readonly VCENTER = "vcenter";
	public static readonly HYPER_V= "hyper-v";
	public static readonly AWS = "aws";
	public static readonly AZURE = "azure";
    public static readonly VALID_TYPES: string[] = [Helper.CMDB_CI_VMWARE_INSTANCE, Helper.CMDB_CI_VCENTER,
    Helper.CMDB_CI_HYPER_V_INSTANCE, Helper.CMDB_CI_VIRTUALIZATION_SERVER, Helper.CMDB_CI_VM_INSTANCE];
}
