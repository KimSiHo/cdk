import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';


// iam policy condition 설정
export class CdkIamCondition extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 👇 Create role
    const role1 = new iam.Role(this, 'iam-role-id-1', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    // 해당 키 이름으로 태그 생성 삭제 권한
    const policyWithConditions = new iam.PolicyStatement({
      actions: ['ec2:CreateTags', 'ec2:DeleteTags'],
      resources: ['*'],
      // 👇 set condition
      conditions: {
        'ForAllValues:StringEquals': {
          'aws:TagKeys': ['my-tag-key', 'your-tag-key'],
        },
      },
    });

    role1.addToPolicy(policyWithConditions);

    // 람다가 요청 서비스 일때만 조건 충족
    // 👇 add a single condition with `addCondition`
    policyWithConditions.addCondition('StringEquals', {
      'ec2:AuthorizedService': 'lambda.amazonaws.com',
    });

    // 👇 add multiple conditions with `addConditions`
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
              // 👇 limit the response of the ListBucket action
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
              // 👇 DENY all but objects with public prefix
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


// iam 정책 설정
export class CdkIamPolicy extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 👇 Create a Role
    const role = new iam.Role(this, 'iam-role-id', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'An example IAM role in AWS CDK',
    });

    // 👇 Create a Managed Policy and associate it with the role
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


    // IAM 엔티티가 생성된 후, managed 정책을 추가하기 위해서 addManagedPolicy 메소드를 사용
    // 이 메소드는 role, user, group 인스턴스에 사용 가능
    // 👇 Create group and pass it an AWS Managed Policy
    const group = new iam.Group(this, 'group-id', {
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
      ],
    });

    // 👇 add a managed policy to a group after creation
    group.addManagedPolicy(managedPolicy);


    // 또 다른 방법으로는 ManagedPolicy 클래스에 attachTo 메소드를 사용하는 것이다
    // 👇 Create User
    const user = new iam.User(this, 'example-user', {
      userName: 'example-user',
    });

    // 👇 attach the managed policy to a User
    managedPolicy.attachToUser(user)


    // 관리형 정책에 policy 추가    
    // 👇 add policy statements to a managed policy
    managedPolicy.addStatements(
      new iam.PolicyStatement({
        actions: ['sqs:GetQueueUrl'],
        resources: ['*'],
      }),
    );


    // aws manage policy import, aws manage policy의 arn을 보고 접두어가 있으면 붙여주어야 한다 접두어가 있는 것도 있고 없는 것도 있고 접두어도 여러가지이다
    // 👇 Import an AWS Managed policy
    const lambdaManagedPolicy = iam.ManagedPolicy.fromAwsManagedPolicyName(
      'service-role/AWSLambdaBasicExecutionRole',
    );

    console.log('managed policy arn 👉', lambdaManagedPolicy.managedPolicyArn);


    // 존재하는 manage policy import하는 법
    // 👇 Import a Customer Managed Policy by Name
    const customerManagedPolicyByName = iam.ManagedPolicy.fromManagedPolicyName(
      this,
      'external-policy-by-name',
      'YOUR_MANAGED_POLICY_NAME',
    );

    // 👇 Import a Customer Managed Policy by ARN
    const customerManagedPolicyByArn = iam.ManagedPolicy.fromManagedPolicyArn(
      this,
      'external-policy-by-arn',
      'YOUR_MANAGED_POLICY_ARN',
    );
  }
}


// iam group 설정
export class CdkIamGroup extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 기본으로 unique한 그룹 네임을 생성, 명시할 수도 있다
    // path 은 그룹의 path이다 기본값은 /
    // 👇 create an IAM group
    const group = new iam.Group(this, 'group-id', {
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ReadOnlyAccess'),
      ],
      //path:
      //groupName:
    });

    console.log('group name 👉', group.groupName);
    console.log('group arn 👉', group.groupArn);

    // 👇 attach a managed policy to the group
    group.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaBasicExecutionRole',
      ),
    );

    // addToPolicy와 attachInlinePolicy는 둘 다 인라인 policy를 추가하지만 받는 객체가 policyStatement랑 policy로 다른 차이인것 같다.
    // 👇 add an inline policy to the group
    // takes a policyStatement instance as a parameter
    group.addToPolicy(
      new iam.PolicyStatement({
        actions: ['logs:CreateLogGroup', 'logs:CreateLogStream'],
        resources: ['*'],
      }),
    );

    // 👇 attach an inline policy on the group
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


    // 👇 create IAM User
    const user = new iam.User(this, 'user-id');

    // 👇 add the User to the group
    group.addUser(user);


    // 👇 import existing Group
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

    // 👇 User imported by username
    const userByName = iam.User.fromUserName(
      this,
      'user-by-name',
      'YOUR_USER_NAME',
    );
    console.log('user name 👉', userByName.userName);

    // arn 으로 임포트
    const userByArn = iam.User.fromUserArn(
      this,
      'user-by-arn',
      `arn:aws:iam::${cdk.Stack.of(this).account}:user/YOUR_USER_NAME`,
    );
    console.log('user name 👉', userByArn.userName);

    // user 속성으로 import, 글 작성 기준 현재 지원하는 attr은 arn뿐이 없어서 arn으로 임포트가 명시적인 이유로 좋고 attr은 사용할 이유가 없음
    const userByAttributes = iam.User.fromUserAttributes(
      this,
      'user-by-attributes',
      {
        userArn: `arn:aws:iam::${cdk.Stack.of(this).account}:user/YOUR_USER_NAME`,
      },
    );
    console.log('user name 👉', userByAttributes.userName);
  }
}


// iam principal
export class CdkIamPrincipal extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 람다 서비스만 해당 권한을 획득 가능
    // 👇 Create a role with a Service Principal
    const role1 = new iam.Role(this, 'role-1', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    // policy에 service principal 추가
    const policy1 = new iam.PolicyStatement({
      resources: ['arn:aws:logs:*:*:log-group:/aws/lambda/*'],
      actions: ['logs:FilterLogEvents'],
    });
    // 👇 add a service principal to the policy
    policy1.addServicePrincipal('ec2.amazonaws.com');


    // account principal은 accound id를 넘겨주면 된다
    // 👇 create a role with an AWS Account principal
    const role2 = new iam.Role(this, 'role-2', {
      assumedBy: new iam.AccountPrincipal(cdk.Stack.of(this).account),
    });

    // 👇 create a role with an Account Root Principal
    const role3 = new iam.Role(this, 'role-3', {
      assumedBy: new iam.AccountRootPrincipal(),
    });

    // 👇 create a role with an ARN Principal
    const role4 = new iam.Role(this, 'role-4', {
      assumedBy: new iam.ArnPrincipal(
        `arn:aws:iam::${cdk.Stack.of(this).account}:user/YOUR_USER_NAME`,
      ),
    });

  }
}


// permission boundary 설정
export class CdkIamPB extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // user나 role에 permission boundary를 부착하기 위해서는 managedpolicy 생성자를 이용해서 iam managed policy를 생성하고 그것을 iam 엔티티에 p b 로 설정해주면 된다
    // 👇 Create Permissions Boundary
    const boundary1 = new iam.ManagedPolicy(this, 'permissions-boundary-1', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          actions: ['sqs:*'],
          resources: ['*'],
        }),
      ],
    });

    // 👇 Create role and attach the permissions boundary
    const role = new iam.Role(this, 'example-iam-role', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'An example IAM role in AWS CDK',
      permissionsBoundary: boundary1,
    });

    console.log(
      'role boundary arn 👉',
      role.permissionsBoundary?.managedPolicyArn,
    );


    // iam user에 pb 설정하는 법
    // 👇 Create a user, to which we will attach the boundary
    const user = new iam.User(this, 'example-user');

    // 👇 attach the permissions boundary to the user
    iam.PermissionsBoundary.of(user).apply(boundary1)


    // pb에 policy 추가하는 법, pb는 단지 관리형 IAM policy이다 
    // 👇 Add Policy Statements to the Permissions Boundary
    boundary1.addStatements(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        actions: ['kinesis:*'],
        resources: ['*'],
      }),
    );


    // 기존에 존재하는 pb (managedpolicy)를 import 하려면 managedPolicy 생성자의 fromManagedPolicyName또는 fromManagedPolicyArn 정적 메소드를 사용하면 된다
    // 👇 Used to import an already existing Permissions Boundary
    const externalBoundary = iam.ManagedPolicy.fromManagedPolicyName(
      this,
      'external-boundary-id',
      'YOUR_MANAGED_POLICY_NAME',
    );

    // 👇 apply the external permissions boundary to the role
    iam.PermissionsBoundary.of(role).apply(externalBoundary);


    // 2번째 pb를 설정하는 것은 첫번째를 삭제하고 교체하는 것이다
    // 👇 attaching a second permissions boundary to a role replaces the first
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


    // 모든 스택 role에게 pb를 설정해야 하면 아래와 같이 한다, of의 인자로 스택을 줄 수 있다
    //iam.PermissionsBoundary.of(stack).apply(boundary1);

    
    // 👇 remove the permission boundary from the User
    iam.PermissionsBoundary.of(user).clear();
  }
}