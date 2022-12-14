import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';


// iam policy condition μ€μ 
export class CdkIamCondition extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // π Create role
    const role1 = new iam.Role(this, 'iam-role-id-1', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    // ν΄λΉ ν€ μ΄λ¦μΌλ‘ νκ·Έ μμ± μ­μ  κΆν
    const policyWithConditions = new iam.PolicyStatement({
      actions: ['ec2:CreateTags', 'ec2:DeleteTags'],
      resources: ['*'],
      // π set condition
      conditions: {
        'ForAllValues:StringEquals': {
          'aws:TagKeys': ['my-tag-key', 'your-tag-key'],
        },
      },
    });

    role1.addToPolicy(policyWithConditions);

    // λλ€κ° μμ²­ μλΉμ€ μΌλλ§ μ‘°κ±΄ μΆ©μ‘±
    // π add a single condition with `addCondition`
    policyWithConditions.addCondition('StringEquals', {
      'ec2:AuthorizedService': 'lambda.amazonaws.com',
    });

    // π add multiple conditions with `addConditions`
    policyWithConditions.addConditions({
      DateLessThan: {
        'aws:CurrentTime': '2022-12-31T23:59:59Z',
      },
      DateGreaterThan: {
        'aws:CurrentTime': '2021-04-27T23:59:59Z',
      },
    });


    const role2 = new iam.Role(this, 'iam-role-id-2', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description:
        'grants permission to list all of the objects in all s3 buckets under a public prefix',
      inlinePolicies: {
        ListBucketObjectsPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              resources: ['arn:aws:s3:::*'],
              actions: ['s3:ListBucket'],
              // π limit the response of the ListBucket action
              conditions: {
                StringEquals: {
                  's3:prefix': 'public',
                },
              },
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.DENY,
              resources: ['arn:aws:s3:::*'],
              actions: ['s3:ListBucket'],
              // π DENY all but objects with public prefix
              conditions: {
                StringNotEquals: {
                  's3:prefix': 'public',
                },
              },
            }),
          ],
        }),
      },
    });
  }
}


// iam μ μ± μ€μ 
export class CdkIamPolicy extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // π Create a Role
    const role = new iam.Role(this, 'iam-role-id', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'An example IAM role in AWS CDK',
    });

    // π Create a Managed Policy and associate it with the role
    const managedPolicy = new iam.ManagedPolicy(this, 'managed-policy-id', {
      description: 'Allows ec2 describe action',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['ec2:Describe'],
          resources: ['*'],
        }),
      ],
      roles: [role],
    });


    // IAM μν°ν°κ° μμ±λ ν, managed μ μ±μ μΆκ°νκΈ° μν΄μ addManagedPolicy λ©μλλ₯Ό μ¬μ©
    // μ΄ λ©μλλ role, user, group μΈμ€ν΄μ€μ μ¬μ© κ°λ₯
    // π Create group and pass it an AWS Managed Policy
    const group = new iam.Group(this, 'group-id', {
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
      ],
    });

    // π add a managed policy to a group after creation
    group.addManagedPolicy(managedPolicy);


    // λ λ€λ₯Έ λ°©λ²μΌλ‘λ ManagedPolicy ν΄λμ€μ attachTo λ©μλλ₯Ό μ¬μ©νλ κ²μ΄λ€
    // π Create User
    const user = new iam.User(this, 'example-user', {
      userName: 'example-user',
    });

    // π attach the managed policy to a User
    managedPolicy.attachToUser(user)


    // κ΄λ¦¬ν μ μ±μ policy μΆκ°    
    // π add policy statements to a managed policy
    managedPolicy.addStatements(
      new iam.PolicyStatement({
        actions: ['sqs:GetQueueUrl'],
        resources: ['*'],
      }),
    );


    // aws manage policy import, aws manage policyμ arnμ λ³΄κ³  μ λμ΄κ° μμΌλ©΄ λΆμ¬μ£Όμ΄μΌ νλ€ μ λμ΄κ° μλ κ²λ μκ³  μλ κ²λ μκ³  μ λμ΄λ μ¬λ¬κ°μ§μ΄λ€
    // π Import an AWS Managed policy
    const lambdaManagedPolicy = iam.ManagedPolicy.fromAwsManagedPolicyName(
      'service-role/AWSLambdaBasicExecutionRole',
    );

    console.log('managed policy arn π', lambdaManagedPolicy.managedPolicyArn);


    // μ‘΄μ¬νλ manage policy importνλ λ²
    // π Import a Customer Managed Policy by Name
    const customerManagedPolicyByName = iam.ManagedPolicy.fromManagedPolicyName(
      this,
      'external-policy-by-name',
      'YOUR_MANAGED_POLICY_NAME',
    );

    // π Import a Customer Managed Policy by ARN
    const customerManagedPolicyByArn = iam.ManagedPolicy.fromManagedPolicyArn(
      this,
      'external-policy-by-arn',
      'YOUR_MANAGED_POLICY_ARN',
    );
  }
}


// iam group μ€μ 
export class CdkIamGroup extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // κΈ°λ³ΈμΌλ‘ uniqueν κ·Έλ£Ή λ€μμ μμ±, λͺμν  μλ μλ€
    // path μ κ·Έλ£Ήμ pathμ΄λ€ κΈ°λ³Έκ°μ /
    // π create an IAM group
    const group = new iam.Group(this, 'group-id', {
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ReadOnlyAccess'),
      ],
      //path:
      //groupName:
    });

    console.log('group name π', group.groupName);
    console.log('group arn π', group.groupArn);

    // π attach a managed policy to the group
    group.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaBasicExecutionRole',
      ),
    );

    // addToPolicyμ attachInlinePolicyλ λ λ€ μΈλΌμΈ policyλ₯Ό μΆκ°νμ§λ§ λ°λ κ°μ²΄κ° policyStatementλ policyλ‘ λ€λ₯Έ μ°¨μ΄μΈκ² κ°λ€.
    // π add an inline policy to the group
    // takes a policyStatement instance as a parameter
    group.addToPolicy(
      new iam.PolicyStatement({
        actions: ['logs:CreateLogGroup', 'logs:CreateLogStream'],
        resources: ['*'],
      }),
    );

    // π attach an inline policy on the group
    // take a policy instance as a parameter
    group.attachInlinePolicy(
      new iam.Policy(this, 'cw-logs', {
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.DENY,
            actions: ['logs:PutLogEvents'],
            resources: ['*'],
          }),
        ],
      }),
    );


    // π create IAM User
    const user = new iam.User(this, 'user-id');

    // π add the User to the group
    group.addUser(user);


    // π import existing Group
    const externalGroup = iam.Group.fromGroupArn(
      this,
      'external-group-id',
      `arn:aws:iam::${cdk.Stack.of(this).account}:group/YOUR_GROUP_NAME`,
    );
  }
}


// iam user
export class CdkIamUser extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // π User imported by username
    const userByName = iam.User.fromUserName(
      this,
      'user-by-name',
      'YOUR_USER_NAME',
    );
    console.log('user name π', userByName.userName);

    // arn μΌλ‘ μν¬νΈ
    const userByArn = iam.User.fromUserArn(
      this,
      'user-by-arn',
      `arn:aws:iam::${cdk.Stack.of(this).account}:user/YOUR_USER_NAME`,
    );
    console.log('user name π', userByArn.userName);

    // user μμ±μΌλ‘ import, κΈ μμ± κΈ°μ€ νμ¬ μ§μνλ attrμ arnλΏμ΄ μμ΄μ arnμΌλ‘ μν¬νΈκ° λͺμμ μΈ μ΄μ λ‘ μ’κ³  attrμ μ¬μ©ν  μ΄μ κ° μμ
    const userByAttributes = iam.User.fromUserAttributes(
      this,
      'user-by-attributes',
      {
        userArn: `arn:aws:iam::${cdk.Stack.of(this).account}:user/YOUR_USER_NAME`,
      },
    );
    console.log('user name π', userByAttributes.userName);
  }
}


// iam principal
export class CdkIamPrincipal extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // λλ€ μλΉμ€λ§ ν΄λΉ κΆνμ νλ κ°λ₯
    // π Create a role with a Service Principal
    const role1 = new iam.Role(this, 'role-1', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    // policyμ service principal μΆκ°
    const policy1 = new iam.PolicyStatement({
      resources: ['arn:aws:logs:*:*:log-group:/aws/lambda/*'],
      actions: ['logs:FilterLogEvents'],
    });
    // π add a service principal to the policy
    policy1.addServicePrincipal('ec2.amazonaws.com');


    // account principalμ accound idλ₯Ό λκ²¨μ£Όλ©΄ λλ€
    // π create a role with an AWS Account principal
    const role2 = new iam.Role(this, 'role-2', {
      assumedBy: new iam.AccountPrincipal(cdk.Stack.of(this).account),
    });

    // π create a role with an Account Root Principal
    const role3 = new iam.Role(this, 'role-3', {
      assumedBy: new iam.AccountRootPrincipal(),
    });

    // π create a role with an ARN Principal
    const role4 = new iam.Role(this, 'role-4', {
      assumedBy: new iam.ArnPrincipal(
        `arn:aws:iam::${cdk.Stack.of(this).account}:user/YOUR_USER_NAME`,
      ),
    });

  }
}


// permission boundary μ€μ 
export class CdkIamPB extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // userλ roleμ permission boundaryλ₯Ό λΆμ°©νκΈ° μν΄μλ managedpolicy μμ±μλ₯Ό μ΄μ©ν΄μ iam managed policyλ₯Ό μμ±νκ³  κ·Έκ²μ iam μν°ν°μ p b λ‘ μ€μ ν΄μ£Όλ©΄ λλ€
    // π Create Permissions Boundary
    const boundary1 = new iam.ManagedPolicy(this, 'permissions-boundary-1', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          actions: ['sqs:*'],
          resources: ['*'],
        }),
      ],
    });

    // π Create role and attach the permissions boundary
    const role = new iam.Role(this, 'example-iam-role', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'An example IAM role in AWS CDK',
      permissionsBoundary: boundary1,
    });

    console.log(
      'role boundary arn π',
      role.permissionsBoundary?.managedPolicyArn,
    );


    // iam userμ pb μ€μ νλ λ²
    // π Create a user, to which we will attach the boundary
    const user = new iam.User(this, 'example-user');

    // π attach the permissions boundary to the user
    iam.PermissionsBoundary.of(user).apply(boundary1)


    // pbμ policy μΆκ°νλ λ², pbλ λ¨μ§ κ΄λ¦¬ν IAM policyμ΄λ€ 
    // π Add Policy Statements to the Permissions Boundary
    boundary1.addStatements(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        actions: ['kinesis:*'],
        resources: ['*'],
      }),
    );


    // κΈ°μ‘΄μ μ‘΄μ¬νλ pb (managedpolicy)λ₯Ό import νλ €λ©΄ managedPolicy μμ±μμ fromManagedPolicyNameλλ fromManagedPolicyArn μ μ  λ©μλλ₯Ό μ¬μ©νλ©΄ λλ€
    // π Used to import an already existing Permissions Boundary
    const externalBoundary = iam.ManagedPolicy.fromManagedPolicyName(
      this,
      'external-boundary-id',
      'YOUR_MANAGED_POLICY_NAME',
    );

    // π apply the external permissions boundary to the role
    iam.PermissionsBoundary.of(role).apply(externalBoundary);


    // 2λ²μ§Έ pbλ₯Ό μ€μ νλ κ²μ μ²«λ²μ§Έλ₯Ό μ­μ νκ³  κ΅μ²΄νλ κ²μ΄λ€
    // π attaching a second permissions boundary to a role replaces the first
    const boundary2 = new iam.ManagedPolicy(this, 'permissions-boundary-2', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          actions: ['ses:*'],
          resources: ['*'],
        }),
      ],
    });

    iam.PermissionsBoundary.of(user).apply(boundary2);


    // λͺ¨λ  μ€ν roleμκ² pbλ₯Ό μ€μ ν΄μΌ νλ©΄ μλμ κ°μ΄ νλ€, ofμ μΈμλ‘ μ€νμ μ€ μ μλ€
    //iam.PermissionsBoundary.of(stack).apply(boundary1);

    
    // π remove the permission boundary from the User
    iam.PermissionsBoundary.of(user).clear();
  }
}